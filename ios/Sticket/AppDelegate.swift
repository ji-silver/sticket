import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Sticket",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    RCTLinkingManager.application(app, open: url, options: options)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  private weak var launchingRootView: RCTRootView?

  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    // JS 준비 중에는 시작 배경을 유지하고, 첫 화면이 표시되면 기본 배경으로 되돌린다.
    // 분홍색을 계속 유지하면 뒤로가기 전환의 가장자리에 시작 배경이 비칠 수 있다.
    launchingRootView = rootView
    rootView.backgroundColor = UIStoryboard(name: "LaunchScreen", bundle: nil)
      .instantiateInitialViewController()?.view.backgroundColor
    NotificationCenter.default.addObserver(
      self, selector: #selector(restoreRootBackground),
      name: .RCTContentDidAppear, object: nil
    )
  }

  @objc private func restoreRootBackground() {
    launchingRootView?.backgroundColor = .systemBackground
    launchingRootView = nil
    NotificationCenter.default.removeObserver(
      self, name: .RCTContentDidAppear, object: nil
    )
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
