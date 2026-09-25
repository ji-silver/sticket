#import "RCTTicketTextRecognizer.h"
#import <React_RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "Sticket-Swift.h"

@interface RCTTicketTextRecognizer ()
@property(nonatomic, strong) TicketTextRecognizer *recognizer;
@end

@implementation RCTTicketTextRecognizer

RCT_EXPORT_MODULE(NativeTicketTextRecognizer)

- (instancetype)init
{
  self = [super init];
  if (self) {
    _recognizer = [TicketTextRecognizer new];
  }
  return self;
}

- (void)recognizeText:(NSString *)imageUri
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject
{
  [self.recognizer recognizeText:imageUri resolve:resolve reject:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<
      facebook::react::NativeTicketTextRecognizerSpecJSI>(params);
}

@end
