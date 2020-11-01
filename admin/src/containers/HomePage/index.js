import React, { memo } from 'react';

import { Block, Container } from './components';

// var QRCode = require('qrcode')
// var canvas = document.getElementById('canvas')
 
// QRCode.toCanvas(canvas, 'sample text', function (error) {
//   if (error) console.error(error)
//   console.log('success!');
// })

const HomePage = ({ global: { plugins }, history: { push } }) => {
  return (
    <>
      <Container className="container-fluid">
        <div className="row">
          <div className="col-12">
            <Block>Hello World!</Block>
          </div>
          <div className="col-12">
          <canvas id="canvas"></canvas>
              </div>
        </div>
      </Container>
    </>
  );
};

export default memo(HomePage);