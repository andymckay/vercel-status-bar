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
  } else {
    rows.push({
      text: "💔",
      dropdown: true,
    });
    rows.push({
      text: "Something is wrong",
      href: "https://www.vercel-status.com/",
    });
  }
  xbar(rows);
}

try {
  const result = await got.get(
    "https://www.vercel-status.com/api/v2/status.json"
  );
  process(result);
} catch (error) {
  console.log(error);
}
