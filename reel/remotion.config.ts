import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setAudioCodec('aac');
Config.setAudioBitrate('320k');
Config.setCrf(14);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
// Chromium local (si no existe, Remotion descarga su propio headless shell)
if (process.env.REMOTION_CHROME) {
  Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}
