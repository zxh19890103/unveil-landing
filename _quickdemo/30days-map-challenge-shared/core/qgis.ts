export interface QgisWmsGetMapParams {
  /** Version of the service. */
  VERSION: "1.1.1" | "1.3.0";

  /**
   * Map extent (bounding box) with units according to the current CRS.
   * Format: 'min_a,min_b,max_a,max_b' (axis order depends on VERSION and CRS).
   */
  BBOX: string;

  /** Width of the output image in pixels. */
  WIDTH: number;

  /** Height of the output image in pixels. */
  HEIGHT: number;

  /**
   * Coordinate Reference System.
   * Use CRS for WMS 1.3.0 (preferred). Note: Either CRS or SRS is required.
   */
  CRS?: "EPSG:4326";

  /**
   * Spatial Reference System.
   * Use SRS for WMS 1.1.1 (required). Note: Either CRS or SRS is required.
   */
  SRS?: string;

  // --------------------------------------------------------------------------
  // OGC WMS Standard Optional Parameters
  // --------------------------------------------------------------------------

  /** Comma-separated list of layer names or IDs to display. */
  LAYERS?: string;

  /** Comma-separated list of styles corresponding to the layers. Default is 'default'. */
  STYLES?: string;

  /** Map image format (e.g., 'image/png', 'image/jpeg', 'application/dxf'). */
  FORMAT?: Format;

  /** Specify background transparency. Available values: 'TRUE' or 'FALSE'. Ignored if FORMAT is not PNG. */
  TRANSPARENT?: TrueFalse;

  /** URL of an Styled Layer Descriptor (SLD) to be used for styling. */
  SLD?: string;

  /** In-line SLD (XML) content to be used for styling. */
  SLD_BODY?: string;

  // --------------------------------------------------------------------------
  // QGIS Server Vendor Parameters (Extensions)
  // --------------------------------------------------------------------------

  /** Path to the QGIS project file. (Required context for QGIS Server). */
  MAP: string;

  /** Background color (literal name like 'green' or hexadecimal like '0x00FF00'). Cannot be combined with TRANSPARENT for PNG. */
  BGCOLOR?: string;

  /** Requested output resolution (e.g., '300'). */
  DPI?: number;

  /** JPEG compression quality (-1 is default). Only used for JPEG images. */
  IMAGE_QUALITY?: string;

  /** Comma-separated list of opacity values (0=transparent to 255=opaque) for layers/groups. */
  OPACITIES?: string;

  /** Subset of features defined using QGIS subset string syntax. */
  FILTER?: string;

  /** Highlight features by passing a semicolon-separated list of 'layername:feature_ids' (e.g., 'mylayer1:3,6,9;mylayer2:1,5,6'). */
  SELECTION?: string;

  /** File name of the downloaded file. Only for FORMAT='application/dxf'. */
  FILE_NAME?: string;

  /** Semicolon-separated list of key:value options for the specified file format (e.g., 'MODE:SYMBOLLAYERSYMBOLOGY;SCALE:250'). Only for FORMAT='application/dxf'. */
  FORMAT_OPTIONS?: FormatOption;

  /** Work in tiled mode. Set to 'TRUE' to apply the Tile buffer. Defaults to 'FALSE'. */
  TILED?: TrueFalse;
}

type TrueFalse = "TRUE" | "FALSE";

type Format =
  | "jpg"
  | "jpeg"
  | "image/jpeg"
  | "image/png"
  | "image/png; mode=1bit"
  | "image/png; mode=8bit"
  | "image/png; mode=16bit"
  | "image/webp"
  | "application/dxf"
  | "application/pdf";

type FormatOption =
  | "SCALE"
  | "MODE"
  | "LAYERATTRIBUTE"
  | "USE_TITLE_AS_LAYERNAME"
  | "CODEC"
  | "NO_MTEXT"
  | "FORCE_2D";
