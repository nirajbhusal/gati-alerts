// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Gati",
    platforms: [.macOS(.v12)],
    targets: [
        .executableTarget(name: "Gati", path: "Sources/Gati")
    ]
)
