import got from "got";
import { xbar, separator } from "./utils.js";

function process(result) {
  let data = JSON.parse(result.body);
  let rows = [];
  if (data.status.indicator === "none") {
    rows.push({
      text: "💚",
      dropdown: false,
    });
    rows.push(separator);
    rows.push({
      text: "All systems operational",
      href: "https://www.vercel-status.com/",
    });
    xbar(rows);
    return

  }
  if (data.status.indicator === "minor") {
    rows.push({
      text: "💛",
      dropdown: false,
    });
    rows.push(separator);
    rows.push({
      text: "Minor issue 👉",
      href: "https://www.vercel-status.com/",
    });
    xbar(rows);
    return;
  }

  rows.push({
    text: "💔",
    dropdown: false,
  });
  rows.push(separator);
  rows.push({
    text: "Something is wrong",
    href: "https://www.vercel-status.com/",
  });
  xbar(rows);
  return;
}

try {
  const result = await got.get(
    "https://www.vercel-status.com/api/v2/status.json"
  );
  process(result);
} catch (error) {
  console.log(error);
}
