import bwipjs from "bwip-js/browser";

// 2벌식(Dubeolsik) 한글 자모 → 영문 키 매핑.
// 스캐너가 키보드 에뮬레이션으로 'B','K' 등을 입력하지만 OS IME가 한글이면
// 'B' → 'ㅠ', 'K' → 'ㅏ'로 변환되어 바코드 ID가 깨진다. 입력값에서 자모를 영문으로 되돌려준다.
const HANGUL_JAMO_TO_LATIN: Record<string, string> = {
  ㅂ: "q", ㅈ: "w", ㄷ: "e", ㄱ: "r", ㅅ: "t",
  ㅛ: "y", ㅕ: "u", ㅑ: "i", ㅐ: "o", ㅔ: "p",
  ㅁ: "a", ㄴ: "s", ㅇ: "d", ㄹ: "f", ㅎ: "g",
  ㅗ: "h", ㅓ: "j", ㅏ: "k", ㅣ: "l",
  ㅋ: "z", ㅌ: "x", ㅊ: "c", ㅍ: "v", ㅠ: "b",
  ㅜ: "n", ㅡ: "m",
  ㅃ: "Q", ㅉ: "W", ㄸ: "E", ㄲ: "R", ㅆ: "T",
  ㅒ: "O", ㅖ: "P",
};

/**
 * 바코드 ID(`BK00001`)는 ASCII 대문자+숫자. IME가 한글일 때 섞여 들어온 자모를
 * 영문 키로 되돌리고 전체를 대문자로 통일한다.
 */
export function normalizeBarcodeInput(raw: string): string {
  if (raw === "") return raw;
  let result = "";
  for (const ch of raw) {
    result += HANGUL_JAMO_TO_LATIN[ch] ?? ch;
  }
  return result.toUpperCase();
}

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
