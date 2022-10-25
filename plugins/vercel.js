import got from "got";
import { xbar, separator, light_icon, dark_icon } from "./utils.js";

import * as dotenv from "dotenv";
import { env, exit } from "node:process";
import { stringify } from "node:querystring";
let env_from_file = dotenv.config().parsed;
let VERCEL_TOKEN = env_from_file?.VERCEL_TOKEN || env?.VERCEL_TOKEN;
let ICON_TO_USE = env_from_file?.VERCEL_ICON === "dark" ? dark_icon : light_icon;

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

function getCheckEmoji(check) {
  switch (check) {
    case "succeeded":
      return "💚";
    case "failed":
      return "💔";
  }
  return "❓";
}

function nicerCreatedAt(time) {
  let date = new Date(time);
  let diff = Date.now() - date.getTime();
  let minutes = Math.floor(diff / 1000 / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  if (days > 0) {
    return `${days} days ago`;
  }
  if (hours > 0) {
    return `${hours} hours ago`;
  }
  return `${minutes} minutes ago`;
}

function process(result, user) {
  let userData = JSON.parse(user.body);
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

  function capitalize(state) {
    if (typeof state !== "string") return "";
    return state.charAt(0).toUpperCase() + state.slice(1).toLowerCase()
  }

  function showDeployment(deployment, submenu) {
    submenu.push({
      text: `Created: ${nicerCreatedAt(deployment.createdAt)}`
    })
    let checkEmoji = getCheckEmoji(deployment.checksConclusion);
    submenu.push({
      text: `${checkEmoji} Checks: ${capitalize(deployment.checksConclusion)}`,
    });
    if (deployment.checksConclusion == "succeeded") {
      submenu.push({
        text: "Open in browser 👉",
        href: `https://${deployment.url}`,
      });
    }
    submenu.push(separator);
  }

  for (let project of JSON.parse(result.body).projects) {
    let text = `${project.name}`;
    let submenu = [];
    submenu.push({
      text: "Open dashboard",
      href: `https://vercel.com/${userData.user.username}/${project.name}`,
    });
    submenu.push(separator);
    for (let [name, target] of Object.entries(project.targets)) {
      let state = target.state;
      submenu.push({
        text: `Target: ${name}`,
      });
      showDeployment(target, submenu);
    }
    if (project.latestDeployments.length > 0) {
      let latestDeployment = project.latestDeployments[0];
      submenu.push({
        text: `Deployment: ${latestDeployment.name}`,
      });
      showDeployment(latestDeployment, submenu);
    }
    if (project.link?.type === "github") {
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

const headers = {
  Authorization: `Bearer ${VERCEL_TOKEN}`,
  "Content-Type": "application/json",
}

const projectOptions = {
  url: "https://api.vercel.com/v9/projects",
  headers: headers
};

const userOptions = {
  url: "https://api.vercel.com/v2/user",
  headers: headers
};

try {
  const user = await got.get(userOptions);
  const result = await got.get(projectOptions);
  process(result, user);
} catch (error) {
  if (error.response) {
    showError(`Error got a ${error.response.statusCode}, see docs 👉`);
  }
  console.log(error);
}