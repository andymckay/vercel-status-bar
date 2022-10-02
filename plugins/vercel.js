const VERCEL_TOKEN = "B3NHyq3pSJPrk1B2omuBP1Hb";
const request = require("request");
const separator = Symbol("separator");

// Copied from https://github.com/sindresorhus/xbar which is under the MIT license.
function xbar(input, options) {
    console.log(create(input, options));
}

const create = (input, options = {}, menuLevel = 0) => {
    if (typeof options.text !== "undefined") {
        throw new TypeError("The `text` option is not supported as a top-level option. Use it on an item instead.");
    }

    return input.map(line => {
        if (typeof line === "string") {
            line = {text: line};
        }

        if (line === separator) {
            return "--".repeat(menuLevel) + "---";
        }

        line = {
            ...options,
            ...line,
        };

        const {text} = line;
        if (typeof text !== "string") {
            throw new TypeError("The `text` property is required and should be a string");
        }

        delete line.text;

        let submenuText = "";
        if (typeof line.submenu === "object" && line.submenu.length > 0) {
            submenuText = `\n${create(line.submenu, options, menuLevel + 1)}`;
            delete line.submenu;
        }

        const prefix = "--".repeat(menuLevel);

        return text.split("\n").map(textLine => {
            const options = Object.entries(line).map(([key, value]) => {
                return `${key}=${value}`;
            }).join(" ");

            return `${prefix}${textLine} | ${options}`;
        }).join("\n") + submenuText;
    }).join("\n");
};

// Vercel specific stuff.
function getStatus(status) {
    switch (status) {
        case "READY":
            return "💚"
        case "BUILDING":
            return "💭"
    }
    return "❓"
};

function getChecks(check) {
    switch (check) {
        case "succeeded":
            return "💚"
        case "failed":
            return "💔"
    }
    return "❓"
}

const options = {
    url: "https://api.vercel.com/v9/projects",
    headers: {
        "Authorization": `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json"
    }
}

function callback(error, response, body) {
    let rows = [];
    rows.push({
        text: "Vercel",
        dropdown: false
    })
    rows.push(separator);
    if (response.statusCode == 403) {
        rows.push("💛 Authentication failed.");
    }

    for (let project of JSON.parse(body).projects) {
        let statusEmoji = getStatus(project.latestDeployments[0].readyState);
        let text = `${statusEmoji} ${project.name}`
        let submenu = [];
        submenu.push({
            text: "Open dashboard",
            href: `https://vercel.com/${project.accountId}/${project.name}`
        })
        if (project.latestDeployments.length > 0) {
            let latestDeployment = project.latestDeployments[0];
            let checkEmoji = getChecks(latestDeployment.checksConclusion);
            submenu.push({
                text: `${checkEmoji} Checks ${latestDeployment.checksConclusion}`,
            })
            if (latestDeployment.checksConclusion == "succeeded") {
                submenu.push({
                    text: "Open latest deployment",
                    href: `https://${latestDeployment.url}`
                })
                submenu.push({
                    text: "Open domain",
                    href: `https://${latestDeployment.alias[0]}`
                })
            }
        }
        if (project.link.type === "github") {
            submenu.push(separator)
            submenu.push({
                text: "Open GitHub",
                href: `https://github.com/${project.link.org}/${project.link.repo}`
            })
        }
        rows.push({
            text: text,
            submenu: submenu
        })

    }
    xbar(rows);
};

request(options, callback)
