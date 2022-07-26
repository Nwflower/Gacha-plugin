import { currentVersion, changelogs, isV3} from "../components/Changelog.js";
import Common from "../components/Common.js";
import { segment } from "oicq";
export async function versionInfo(e, { render }) {
  let base64 = await Common.render("version/version-info", {
    currentVersion,
    changelogs,
    elem: "cryo",
  }, { e, render, scale: 1.2 })
  return isV3 ? e.reply(base64) : e.reply(segment.image(`base64://${base64}`));
}