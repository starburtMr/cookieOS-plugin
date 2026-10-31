// Generated from quicktype-core 23.0.170 (Apache-2.0), Ctool Protobuf/PHP options; checked against the runtime in tests.
import type {Option} from "./type";
const definitions: Option[] = [
  {
    "name": "inline",
    "description": "Inline",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "googleProtobufTimestamp",
    "description": "Detect Timestamp",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "mergeSimilarObjects",
    "description": "merge Similar Objects",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "namespace",
    "description": "Namespace",
    "type": "string",
    "defaultValue": "Ctool"
  },
  {
    "name": "className",
    "description": "Class Name",
    "type": "string",
    "defaultValue": "Json"
  },
  {
    "name": "visibility",
    "description": "Visibility",
    "type": "select",
    "value": [
      "public",
      "private",
      "protected"
    ],
    "defaultValue": "private"
  },
  {
    "name": "getters",
    "description": "Getters",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "setters",
    "description": "Setters",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "typedProperties",
    "description": "Typed Properties",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "typedMethods",
    "description": "Typed Methods",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "includeDeps",
    "description": "Include Class Dependencies",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "source-style",
    "description": "Source code generation type, whether to generate single or multiple source files",
    "type": "select",
    "value": [
      "single-source",
      "multi-source"
    ],
    "defaultValue": "single-source"
  },
  {
    "name": "integer-size",
    "description": "Integer code generation type (int64_t by default)",
    "type": "select",
    "value": [
      "int8_t",
      "int16_t",
      "int32_t",
      "int64_t"
    ],
    "defaultValue": "int64_t"
  },
  {
    "name": "typedef-alias",
    "description": "Add typedef alias to unions, structs, and enums (no typedef by default)",
    "type": "select",
    "value": [
      "no-typedef",
      "add-typedef"
    ],
    "defaultValue": "no-typedef"
  },
  {
    "name": "print-style",
    "description": "Which cJSON print should be used (formatted by default)",
    "type": "select",
    "value": [
      "print-formatted",
      "print-unformatted"
    ],
    "defaultValue": "print-formatted"
  },
  {
    "name": "hashtable-size",
    "description": "Hashtable size, used when maps are created (64 by default)",
    "type": "string",
    "defaultValue": "64"
  },
  {
    "name": "type-style",
    "description": "Naming style for types",
    "type": "select",
    "value": [
      "pascal-case",
      "underscore-case",
      "camel-case",
      "upper-underscore-case",
      "pascal-case-upper-acronyms",
      "camel-case-upper-acronyms"
    ],
    "defaultValue": "pascal-case"
  },
  {
    "name": "member-style",
    "description": "Naming style for members",
    "type": "select",
    "value": [
      "underscore-case",
      "pascal-case",
      "camel-case",
      "upper-underscore-case",
      "pascal-case-upper-acronyms",
      "camel-case-upper-acronyms"
    ],
    "defaultValue": "underscore-case"
  },
  {
    "name": "enumerator-style",
    "description": "Naming style for enumerators",
    "type": "select",
    "value": [
      "upper-underscore-case",
      "underscore-case",
      "pascal-case",
      "camel-case",
      "pascal-case-upper-acronyms",
      "camel-case-upper-acronyms"
    ],
    "defaultValue": "upper-underscore-case"
  },
  {
    "name": "inferMaps",
    "description": "Detect maps",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "inferEnums",
    "description": "Detect enums",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "combineClasses",
    "description": "Merge similar classes",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "ignoreJsonRefs",
    "description": "Don't treat $ref as a reference in JSON",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "allPropertiesOptional",
    "description": "Make all class property optional",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "just-types",
    "description": "Plain types only",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "namespace",
    "description": "Name of the generated namespace(s)",
    "type": "string",
    "defaultValue": "quicktype"
  },
  {
    "name": "code-format",
    "description": "Generate classes with getters/setters, instead of structs",
    "type": "select",
    "value": [
      "with-struct",
      "with-getter-setter"
    ],
    "defaultValue": "with-getter-setter"
  },
  {
    "name": "wstring",
    "description": "Store strings using Utf-16 std::wstring, rather than Utf-8 std::string",
    "type": "select",
    "value": [
      "use-string",
      "use-wstring"
    ],
    "defaultValue": "use-string"
  },
  {
    "name": "const-style",
    "description": "Put const to the left/west (const T) or right/east (T const)",
    "type": "select",
    "value": [
      "west-const",
      "east-const"
    ],
    "defaultValue": "west-const"
  },
  {
    "name": "source-style",
    "description": "Source code generation type,  whether to generate single or multiple source files",
    "type": "select",
    "value": [
      "single-source",
      "multi-source"
    ],
    "defaultValue": "single-source"
  },
  {
    "name": "include-location",
    "description": "Whether json.hpp is to be located globally or locally",
    "type": "select",
    "value": [
      "local-include",
      "global-include"
    ],
    "defaultValue": "local-include"
  },
  {
    "name": "enum-type",
    "description": "Type of enum class",
    "type": "string",
    "defaultValue": "int"
  },
  {
    "name": "boost",
    "description": "Require a dependency on boost. Without boost, C++17 is required",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "hide-null-optional",
    "description": "Hide null value for optional field",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "framework",
    "description": "Serialization framework",
    "type": "select",
    "value": [
      "NewtonSoft",
      "SystemTextJson"
    ],
    "defaultValue": "NewtonSoft"
  },
  {
    "name": "namespace",
    "description": "Generated namespace",
    "type": "string",
    "defaultValue": "QuickType"
  },
  {
    "name": "csharp-version",
    "description": "C# version",
    "type": "select",
    "value": [
      "5",
      "6"
    ],
    "defaultValue": "6"
  },
  {
    "name": "density",
    "description": "Property density",
    "type": "select",
    "value": [
      "normal",
      "dense"
    ],
    "defaultValue": "normal"
  },
  {
    "name": "array-type",
    "description": "Use T[] or List<T>",
    "type": "select",
    "value": [
      "array",
      "list"
    ],
    "defaultValue": "array"
  },
  {
    "name": "number-type",
    "description": "Type to use for numbers",
    "type": "select",
    "value": [
      "double",
      "decimal"
    ],
    "defaultValue": "double"
  },
  {
    "name": "any-type",
    "description": "Type to use for \"any\"",
    "type": "select",
    "value": [
      "object",
      "dynamic"
    ],
    "defaultValue": "object"
  },
  {
    "name": "virtual",
    "description": "Generate virtual properties",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "features",
    "description": "Output features",
    "type": "select",
    "value": [
      "complete",
      "attributes-only",
      "just-types-and-namespace",
      "just-types"
    ],
    "defaultValue": "complete"
  },
  {
    "name": "base-class",
    "description": "Base class",
    "type": "select",
    "value": [
      "EntityData",
      "Object"
    ],
    "defaultValue": "Object"
  },
  {
    "name": "check-required",
    "description": "Fail if required properties are missing",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "keep-property-name",
    "description": "Keep original field name generate",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "inferUuids",
    "description": "Detect UUIDs",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "inferDateTimes",
    "description": "Detect dates & times",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "inferIntegerStrings",
    "description": "Detect integers in strings",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "inferBooleanStrings",
    "description": "Detect booleans in strings",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "null-safety",
    "description": "Null Safety",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "just-types",
    "description": "Types only",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "coders-in-class",
    "description": "Put encoder & decoder in Class",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "from-map",
    "description": "Use method names fromMap() & toMap()",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "required-props",
    "description": "Make all properties required",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "final-props",
    "description": "Make all properties final",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "copy-with",
    "description": "Generate CopyWith method",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "use-freezed",
    "description": "Generate class definitions with @freezed compatibility",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "use-hive",
    "description": "Generate annotations for Hive type adapters",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "use-json-annotation",
    "description": "Generate annotations for json_serializable",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "part-name",
    "description": "Use this name in `part` directive",
    "type": "string",
    "defaultValue": ""
  },
  {
    "name": "namespace",
    "description": "Specify a module namespace",
    "type": "string",
    "defaultValue": ""
  },
  {
    "name": "module",
    "description": "Generated module name",
    "type": "string",
    "defaultValue": "QuickType"
  },
  {
    "name": "array-type",
    "description": "Use Array or List",
    "type": "select",
    "value": [
      "array",
      "list"
    ],
    "defaultValue": "array"
  },
  {
    "name": "just-types",
    "description": "Interfaces only",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "nice-property-names",
    "description": "Transform property names to be JavaScripty",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "explicit-unions",
    "description": "Explicitly name unions",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "runtime-typecheck",
    "description": "Verify JSON.parse results at runtime",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "runtime-typecheck-ignore-unknown-properties",
    "description": "Ignore unknown properties when verifying at runtime",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "acronym-style",
    "description": "Acronym naming style",
    "type": "select",
    "value": [
      "original",
      "pascal",
      "camel",
      "lowerCase"
    ],
    "defaultValue": "pascal"
  },
  {
    "name": "converters",
    "description": "Which converters to generate (top-level by default)",
    "type": "select",
    "value": [
      "top-level",
      "all-objects"
    ],
    "defaultValue": "top-level"
  },
  {
    "name": "raw-type",
    "description": "Type of raw input (json by default)",
    "type": "select",
    "value": [
      "json",
      "any"
    ],
    "defaultValue": "json"
  },
  {
    "name": "prefer-unions",
    "description": "Use union type instead of enum",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "prefer-types",
    "description": "Use types instead of interfaces",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "prefer-const-values",
    "description": "Use string instead of enum for string enums with single value",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "readonly",
    "description": "Use readonly type members",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "just-types-and-package",
    "description": "Plain types with package only",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "package",
    "description": "Generated package name",
    "type": "string",
    "defaultValue": "main"
  },
  {
    "name": "multi-file-output",
    "description": "Renders each top-level object in its own Go file",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "field-tags",
    "description": "list of tags which should be generated for fields",
    "type": "string",
    "defaultValue": "json"
  },
  {
    "name": "omit-empty",
    "description": "If set, all non-required objects will be tagged with \",omitempty\"",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "datetime-provider",
    "description": "Date time provider type",
    "type": "select",
    "value": [
      "java8",
      "legacy"
    ],
    "defaultValue": "java8"
  },
  {
    "name": "package",
    "description": "Generated package name",
    "type": "string",
    "defaultValue": "io.quicktype"
  },
  {
    "name": "lombok",
    "description": "Use lombok",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "lombok-copy-annotations",
    "description": "Copy accessor annotations",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "framework",
    "description": "Serialization framework",
    "type": "select",
    "value": [
      "just-types",
      "jackson",
      "klaxon",
      "kotlinx"
    ],
    "defaultValue": "klaxon"
  },
  {
    "name": "package",
    "description": "Package",
    "type": "string",
    "defaultValue": "quicktype"
  },
  {
    "name": "class-prefix",
    "description": "Class prefix",
    "type": "string",
    "defaultValue": "QT"
  },
  {
    "name": "features",
    "description": "Interface and implementation",
    "type": "select",
    "value": [
      "all",
      "interface",
      "implementation"
    ],
    "defaultValue": "all"
  },
  {
    "name": "extra-comments",
    "description": "Extra comments",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "functions",
    "description": "C-style functions",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "python-version",
    "description": "Python version",
    "type": "select",
    "value": [
      "3.5",
      "3.6",
      "3.7"
    ],
    "defaultValue": "3.6"
  },
  {
    "name": "just-types",
    "description": "Classes only",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "nice-property-names",
    "description": "Transform property names to be Pythonic",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "strictness",
    "description": "Type strictness",
    "type": "select",
    "value": [
      "strict",
      "coercible",
      "none"
    ],
    "defaultValue": "strict"
  },
  {
    "name": "namespace",
    "description": "Specify a wrapping Namespace",
    "type": "string",
    "defaultValue": ""
  },
  {
    "name": "density",
    "description": "Density",
    "type": "select",
    "value": [
      "normal",
      "dense"
    ],
    "defaultValue": "normal"
  },
  {
    "name": "visibility",
    "description": "Field visibility",
    "type": "select",
    "value": [
      "private",
      "crate",
      "public"
    ],
    "defaultValue": "private"
  },
  {
    "name": "derive-debug",
    "description": "Derive Debug impl",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "derive-clone",
    "description": "Derive Clone impl",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "derive-partial-eq",
    "description": "Derive PartialEq impl",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "edition-2018",
    "description": "Edition 2018",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "leading-comments",
    "description": "Leading Comments",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "skip-serializing-none",
    "description": "Skip serializing empty Option fields",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "framework",
    "description": "Serialization framework",
    "type": "select",
    "value": [
      "just-types",
      "circe",
      "upickle"
    ],
    "defaultValue": "just-types"
  },
  {
    "name": "framework",
    "description": "Serialization framework",
    "type": "select",
    "value": [
      "just-types"
    ],
    "defaultValue": "just-types"
  },
  {
    "name": "struct-or-class",
    "description": "Structs or classes",
    "type": "select",
    "value": [
      "struct",
      "class"
    ],
    "defaultValue": "struct"
  },
  {
    "name": "density",
    "description": "Code density",
    "type": "select",
    "value": [
      "dense",
      "normal"
    ],
    "defaultValue": "dense"
  },
  {
    "name": "initializers",
    "description": "Generate initializers and mutators",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "coding-keys",
    "description": "Explicit CodingKey values in Codable types",
    "type": "boolean",
    "defaultValue": true
  },
  {
    "name": "coding-keys-protocol",
    "description": "CodingKeys implements protocols",
    "type": "string",
    "defaultValue": ""
  },
  {
    "name": "access-level",
    "description": "Access level",
    "type": "select",
    "value": [
      "internal",
      "public"
    ],
    "defaultValue": "internal"
  },
  {
    "name": "alamofire",
    "description": "Alamofire extensions",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "support-linux",
    "description": "Support Linux",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "type-prefix",
    "description": "Prefix for type names",
    "type": "string",
    "defaultValue": ""
  },
  {
    "name": "protocol",
    "description": "Make types implement protocol",
    "type": "select",
    "value": [
      "none",
      "equatable",
      "hashable"
    ],
    "defaultValue": "none"
  },
  {
    "name": "objective-c-support",
    "description": "Objects inherit from NSObject and @objcMembers is added to classes",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "optional-enums",
    "description": "If no matching case is found enum value is set to null",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "sendable",
    "description": "Mark generated models as Sendable",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "swift-5-support",
    "description": "Renders output in a Swift 5 compatible mode",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "multi-file-output",
    "description": "Renders each top-level object in its own Swift file",
    "type": "boolean",
    "defaultValue": false
  },
  {
    "name": "mutable-properties",
    "description": "Use var instead of let for object properties",
    "type": "boolean",
    "defaultValue": false
  }
];
const references: Record<string, number[]> = {
  "ProtoBuf": [
    0,
    1,
    2
  ],
  "PHP": [
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10
  ],
  "C (cJSON)": [
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23
  ],
  "C++": [
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    16,
    17,
    18,
    31,
    32,
    33,
    19,
    20,
    21,
    22,
    23
  ],
  "Crystal": [
    19,
    20,
    21,
    22,
    23
  ],
  "C#": [
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    19,
    20,
    46,
    47,
    48,
    49,
    21,
    22,
    23
  ],
  "Dart": [
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    19,
    20,
    47,
    21,
    22,
    23
  ],
  "Elixir": [
    24,
    61,
    19,
    20,
    21,
    22,
    23
  ],
  "Elm": [
    24,
    62,
    63,
    19,
    20,
    21,
    22,
    23
  ],
  "Flow": [
    64,
    65,
    66,
    67,
    68,
    69,
    70,
    71,
    72,
    73,
    74,
    75,
    19,
    20,
    47,
    21,
    22,
    23
  ],
  "Go": [
    24,
    76,
    77,
    78,
    79,
    80,
    19,
    20,
    47,
    21,
    22,
    23
  ],
  "Haskell": [
    24,
    62,
    63,
    19,
    20,
    21,
    22,
    23
  ],
  "Java": [
    38,
    24,
    81,
    69,
    82,
    83,
    84,
    19,
    20,
    46,
    47,
    21,
    22,
    23
  ],
  "JavaScript": [
    67,
    68,
    69,
    70,
    71,
    19,
    20,
    47,
    21,
    22,
    23
  ],
  "JavaScript PropTypes": [
    69,
    70,
    19,
    20,
    21,
    22,
    23
  ],
  "JSON Schema": [
    19,
    20,
    46,
    47,
    48,
    49,
    21,
    22,
    23
  ],
  "Kotlin": [
    85,
    69,
    86,
    19,
    20,
    21,
    22,
    23
  ],
  "Objective-C": [
    24,
    87,
    88,
    89,
    90,
    19,
    20,
    21,
    22,
    23
  ],
  "Pike": [
    19,
    20,
    21,
    22,
    23
  ],
  "Python": [
    91,
    92,
    93,
    19,
    20,
    46,
    47,
    48,
    49,
    21,
    22,
    23
  ],
  "Ruby": [
    24,
    94,
    95,
    19,
    20,
    21,
    22,
    23
  ],
  "Rust": [
    96,
    97,
    98,
    99,
    100,
    101,
    102,
    103,
    19,
    20,
    21,
    22,
    23
  ],
  "Scala3": [
    104,
    86,
    19,
    20,
    21,
    22,
    23
  ],
  "Smithy": [
    105,
    86,
    19,
    20,
    21,
    22,
    23
  ],
  "Swift": [
    24,
    106,
    107,
    108,
    109,
    110,
    111,
    112,
    113,
    114,
    115,
    69,
    116,
    117,
    118,
    119,
    120,
    121,
    19,
    20,
    47,
    21,
    22,
    23
  ],
  "TypeScript": [
    64,
    65,
    66,
    67,
    68,
    69,
    70,
    71,
    72,
    73,
    74,
    75,
    19,
    20,
    47,
    21,
    22,
    23
  ],
  "TypeScript Effect Schema": [
    19,
    20,
    21,
    22,
    23
  ],
  "TypeScript Zod": [
    19,
    20,
    47,
    21,
    22,
    23
  ]
};
export const languages = Object.keys(references);
export const optionDefinitions: Record<string, Option[]> = Object.fromEntries(Object.entries(references).map(([lang, indexes]) => [lang, indexes.map(index => definitions[index])]));
