import { currentVersion, changelogs } from "../components/Changelog.js";
import Common from "../components/Common.js";

export async function versionInfo(e, { render }) {
  return await Common.render("version/version-info", {
    currentVersion,
    changelogs,
    elem: "cryo",
  }, { e, render, scale: 1.2 })
}