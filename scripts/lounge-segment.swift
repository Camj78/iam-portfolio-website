// Person segmentation for the Access Lounge cover (Apple Vision, on-device).
//   xcrun swift scripts/lounge-segment.swift <in.png> <out-mask.png>
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1]), output = URL(fileURLWithPath: args[2])
let ci = CIImage(contentsOf: input)!
let req = VNGeneratePersonSegmentationRequest()
req.qualityLevel = .accurate
req.outputPixelFormat = kCVPixelFormatType_OneComponent8
try VNImageRequestHandler(ciImage: ci, options: [:]).perform([req])
let buf = req.results!.first!.pixelBuffer
var mask = CIImage(cvPixelBuffer: buf)
// Scale the mask to the source size.
mask = mask.transformed(by: CGAffineTransform(scaleX: ci.extent.width / mask.extent.width, y: ci.extent.height / mask.extent.height))
let ctx = CIContext()
let cg = ctx.createCGImage(mask, from: ci.extent)!
let rep = NSBitmapImageRep(cgImage: cg)
try rep.representation(using: .png, properties: [:])!.write(to: output)
print("mask", Int(mask.extent.width), Int(mask.extent.height), "from", CVPixelBufferGetWidth(buf), CVPixelBufferGetHeight(buf))
