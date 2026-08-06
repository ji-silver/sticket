const fs = require('fs');
const path = require('path');

const packageRoot = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-pencil-kit',
);

function patchFile(relativePath, before, after) {
  const filePath = path.join(packageRoot, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');

  if (source.includes(after)) {
    return;
  }

  if (!source.includes(before)) {
    throw new Error(
      `react-native-pencil-kit 패치 대상을 찾을 수 없습니다: ${relativePath}`,
    );
  }

  fs.writeFileSync(filePath, source.replace(before, after));
}

patchFile(
  'src/component/PencilKit.tsx',
  '  getBase64Data: () => Promise<string>;\n',
  '  getBase64Data: () => Promise<string>;\n  hasDrawing: () => Promise<boolean>;\n',
);

patchFile(
  'src/component/PencilKit.ios.tsx',
  `      getBase64Data: async () => {
        const handle = findNodeHandle(nativeRef.current) ?? -1;

        return NativeRNPencilKitUtil.getBase64Data(handle);
      },
`,
  `      getBase64Data: async () => {
        const handle = findNodeHandle(nativeRef.current) ?? -1;

        return NativeRNPencilKitUtil.getBase64Data(handle);
      },
      hasDrawing: async () => {
        const handle = findNodeHandle(nativeRef.current) ?? -1;

        return NativeRNPencilKitUtil.hasDrawing(handle);
      },
`,
);

patchFile(
  'src/spec/NativeRNPencilKitUtil.ts',
  '  getBase64Data(viewId: Double): Promise<string>;\n',
  '  getBase64Data(viewId: Double): Promise<string>;\n  hasDrawing(viewId: Double): Promise<boolean>;\n',
);

patchFile(
  'ios/RNPencilKit.h',
  '- (NSString*)getBase64Data;\n',
  '- (NSString*)getBase64Data;\n- (BOOL)hasDrawing;\n',
);

patchFile(
  'ios/RNPencilKit.mm',
  `- (NSString*)getBase64Data {
  return [_view.drawing.dataRepresentation base64EncodedStringWithOptions:0];
}
`,
  `- (NSString*)getBase64Data {
  return [_view.drawing.dataRepresentation base64EncodedStringWithOptions:0];
}

- (BOOL)hasDrawing {
  return _view.drawing.strokes.count > 0;
}
`,
);

patchFile(
  'ios/RNPencilKitUtil.mm',
  `- (void)getBase64JpegData:(double)viewId
`,
  `- (void)hasDrawing:(double)viewId
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  RCTExecuteOnMainQueue(^{
    RNPencilKit* view = [self getView:viewId];
    resolve(@([view hasDrawing]));
  });
}

- (void)getBase64JpegData:(double)viewId
`,
);

patchFile(
  'lib/typescript/src/component/PencilKit.d.ts',
  '    getBase64Data: () => Promise<string>;\n',
  '    getBase64Data: () => Promise<string>;\n    hasDrawing: () => Promise<boolean>;\n',
);

patchFile(
  'lib/typescript/src/spec/NativeRNPencilKitUtil.d.ts',
  '    getBase64Data(viewId: Double): Promise<string>;\n',
  '    getBase64Data(viewId: Double): Promise<string>;\n    hasDrawing(viewId: Double): Promise<boolean>;\n',
);

patchFile(
  'lib/commonjs/component/PencilKit.ios.js',
  `    getBase64Data: async () => {
      const handle = (0, _reactNative.findNodeHandle)(nativeRef.current) ?? -1;
      return _NativeRNPencilKitUtil.default.getBase64Data(handle);
    },
`,
  `    getBase64Data: async () => {
      const handle = (0, _reactNative.findNodeHandle)(nativeRef.current) ?? -1;
      return _NativeRNPencilKitUtil.default.getBase64Data(handle);
    },
    hasDrawing: async () => {
      const handle = (0, _reactNative.findNodeHandle)(nativeRef.current) ?? -1;
      return _NativeRNPencilKitUtil.default.hasDrawing(handle);
    },
`,
);

patchFile(
  'lib/module/component/PencilKit.ios.js',
  `    getBase64Data: async () => {
      const handle = findNodeHandle(nativeRef.current) ?? -1;
      return NativeRNPencilKitUtil.getBase64Data(handle);
    },
`,
  `    getBase64Data: async () => {
      const handle = findNodeHandle(nativeRef.current) ?? -1;
      return NativeRNPencilKitUtil.getBase64Data(handle);
    },
    hasDrawing: async () => {
      const handle = findNodeHandle(nativeRef.current) ?? -1;
      return NativeRNPencilKitUtil.hasDrawing(handle);
    },
`,
);
