import Foundation
import React
import Vision

@objcMembers public final class TicketTextRecognizer: NSObject {
  // ponytail: 실기기 티켓에서 오탐이나 미탐이 확인되면 이 값만 조정한다.
  private let minimumConfidence: VNConfidence = 0.5

  public func recognizeText(
    _ imageUri: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let url = imageUri.hasPrefix("file://")
          ? URL(string: imageUri)
          : URL(fileURLWithPath: imageUri)

        guard let url, url.isFileURL else {
          reject(
            "ticket_ocr_invalid_uri",
            "티켓 이미지 경로가 올바르지 않습니다.",
            nil
          )
          return
        }

        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["ko-KR", "en-US"]
        request.usesLanguageCorrection = true

        try VNImageRequestHandler(url: url, options: [:]).perform([request])

        let text = (request.results ?? [])
          .sorted {
            if abs($0.boundingBox.midY - $1.boundingBox.midY) > 0.01 {
              return $0.boundingBox.midY > $1.boundingBox.midY
            }

            return $0.boundingBox.minX < $1.boundingBox.minX
          }
          .compactMap { $0.topCandidates(1).first }
          .filter { $0.confidence >= self.minimumConfidence }
          .map(\.string)
          .joined(separator: "\n")

        resolve(text)
      } catch {
        reject("ticket_ocr_failed", "티켓 이미지를 읽지 못했습니다.", error)
      }
    }
  }
}
