import got from "got";
import { xbar, separator, light_icon, dark_icon } from "./utils.js";

import * as dotenv from "dotenv";
import { env, exit } from "node:process";
let env_from_file = dotenv.config().parsed;
let VERCEL_TOKEN = env_from_file?.VERCEL_TOKEN || env?.VERCEL_TOKEN;
let ICON_TO_USE = env_from_file?.ICON === "dark" ? dark_icon : light_icon;

function showError(text) {
  let rows = [];
  rows.push({
    text: "❌",
    dropdown: false,
  });
  rows.push(separator);
  rows.push({
    text: text,
    href: "https://github.com/andymckay/vercel-status-bar",
  });
  xbar(rows);
  exit();
}

if (!VERCEL_TOKEN) {
  showError("No API token found, see docs 👉");
}

// Vercel specific stuff.
function getStatus(status) {
  switch (status) {
    case "READY":
      return "💚";
    case "BUILDING":
      return "💭";
  }
  return "❓";
}

function getChecks(check) {
  switch (check) {
    case "succeeded":
      return "💚";
    case "failed":
      return "💔";
  }
  return "❓";
}

const options = {
  url: "https://api.vercel.com/v9/projects",
  headers: {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  },
};

function process(result) {
  let rows = [];
  rows.push({
    text: " ",
    image: ICON_TO_USE,
    dropdown: false,
  });
  rows.push(separator);
  if (result.statusCode == 403) {
    rows.push("💛 Authentication failed.");
  }

  for (let project of JSON.parse(result.body).projects) {
    let statusEmoji = getStatus(project.latestDeployments[0].readyState);
    let text = `${statusEmoji} ${project.name}`;
    let submenu = [];
    submenu.push({
      text: "Open dashboard",
      href: `https://vercel.com/${project.accountId}/${project.name}`,
    });
    if (project.latestDeployments.length > 0) {
      let latestDeployment = project.latestDeployments[0];
      let checkEmoji = getChecks(latestDeployment.checksConclusion);
      submenu.push({
        text: `${checkEmoji} Checks ${latestDeployment.checksConclusion}`,
      });
      if (latestDeployment.checksConclusion == "succeeded") {
        submenu.push({
          text: "Open latest deployment",
          href: `https://${latestDeployment.url}`,
        });
        submenu.push({
          text: "Open domain",
          href: `https://${latestDeployment.alias[0]}`,
        });
      }
    }
    if (project.link.type === "github") {
      submenu.push(separator);
      submenu.push({
        text: "Open GitHub",
        href: `https://github.com/${project.link.org}/${project.link.repo}`,
      });
    }
    rows.push({
      text: text,
      submenu: submenu,
    });
  }
  xbar(rows);
}

try {
  const result = await got.get(options);
  process(result);
} catch (error) {
  if (error.response) {
    showError(`Error got a ${error.response.statusCode}, see docs 👉`);
  }
  console.log(error);
}
