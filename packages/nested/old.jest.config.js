"use strict";
exports.__esModule = true;
/* eslint-disable */
exports["default"] = {
    displayName: "nested",
    preset: "../../jest.preset.js",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/tsconfig.test.json"
        }
    },
    transform: {
        "^.+\\.[tj]s$": "ts-jest"
    },
    moduleFileExtensions: ["ts", "js", "html"],
    coverageDirectory: "../../coverage/packages/nested"
};
