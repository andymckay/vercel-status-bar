import got from "got";
import { xbar, separator, light_icon, dark_icon } from "./utils.js";

import * as dotenv from "dotenv";
import { env, exit } from "node:process";
import { stringify } from "node:querystring";
let env_from_file = dotenv.config().parsed;
let VERCEL_TOKEN = env_from_file?.VERCEL_TOKEN || env?.VERCEL_TOKEN;
let ICON_TO_USE =
  env_from_file?.VERCEL_ICON === "dark" ? dark_icon : light_icon;
let VERCEL_TEAM = env_from_file?.VERCEL_TEAM || env?.VERCEL_TEAM;

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

function getSlug(user, teams) {
  if (VERCEL_TEAM) {
    return teams[VERCEL_TEAM];
  }
  return user.username;
}

function process(result, user, teams) {
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
    return state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  }

  function showDeployment(deployment, submenu) {
    submenu.push({
      text: `Created: ${nicerCreatedAt(deployment.createdAt)}`,
    });
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
      href: `https://vercel.com/${getSlug(user, teams)}/${project.name}`,
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
  if (VERCEL_TEAM) {
    rows.push({
      text: `Showing team: ${teams[VERCEL_TEAM]}`,
    });
  } else {
    rows.push({
      text: `Showing user: ${user.username}`,
    });
  }
  xbar(rows);
}

const headers = {
  Authorization: `Bearer ${VERCEL_TOKEN}`,
  "Content-Type": "application/json",
};

const projectOptions = {
  url: `https://api.vercel.com/v9/projects?teamId=${VERCEL_TEAM}`,
  headers: headers,
};

const userOptions = {
  url: "https://api.vercel.com/v2/user",
  headers: headers,
};

const teamOptions = {
  url: "https://api.vercel.com/v2/teams",
  headers: headers,
};

function processTeams(teams) {
  let teamsBody = JSON.parse(teams.body);
  for (let t of teamsBody.teams) {
    teams[t.id] = t.slug;
  }
  return teams;
}

function processUser(user) {
  return JSON.parse(user.body).user;
}

try {
  const gotTeams = await got.get(teamOptions);
  const teams = processTeams(gotTeams);
  const gotUser = await got.get(userOptions);
  const user = processUser(gotUser);
  const gotResult = await got.get(projectOptions);
  process(gotResult, user, teams);
} catch (error) {
  if (error.response) {
    console.log(error.response.body);
    showError(`Error got a ${error.response.statusCode}, see docs 👉`);
  }
  console.log(error);
}
