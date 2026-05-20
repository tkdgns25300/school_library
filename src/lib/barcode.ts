import bwipjs from "bwip-js/browser";

export async function generateBarcodePng(value: string): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  bwipjs.toCanvas(canvas, {
    bcid: "code128",
    text: value,
    scale: 3,
    height: 10,
    includetext: false,
  });

  return await new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("바코드 이미지 생성 실패"));
        return;
      }
      const buffer = await blob.arrayBuffer();
      resolve(new Uint8Array(buffer));
    }, "image/png");
  });
}
