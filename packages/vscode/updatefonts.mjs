import "zx/globals";
import webfont from "webfont";

const svgs = ["./icon.svg"];

async function generateFont() {
  try {
    console.log(`build font for ${svgs}`);
    const result = await webfont.webfont({
      files: svgs,
      formats: ["woff"],
      startUnicode: 0xe000,
      verbose: false,
      normalize: true,
      sort: false,
    });
    fs.ensureDirSync("./media");
    const dest = path.join("./media", "genaiscript.woff");
    fs.writeFileSync(dest, result.woff, "binary");
    console.log(`Font created at ${dest}`);
    process.exit(0);
  } catch (e) {
    console.error("Font creation failed.", e);
    process.exit(-1);
  }
}

generateFont();
