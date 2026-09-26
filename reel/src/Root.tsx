import React from 'react';
import {Composition, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Variables01} from './Variables01';
import {FPS, H, W} from './theme';
import {TOTAL_FRAMES} from './timings';

loadFont({family: 'Cormorant Garamond', url: staticFile('fonts/cormorant-garamond-latin-300-italic.woff2'), weight: '300', style: 'italic'});
loadFont({family: 'Jost', url: staticFile('fonts/jost-latin-200-normal.woff2'), weight: '200', style: 'normal'});

export const Root: React.FC = () => (
  <Composition id="Variables01" component={Variables01} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
);
