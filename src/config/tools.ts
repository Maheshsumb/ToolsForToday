export type ToolCategory = "image" | "pdf" | "utility";
export type ToolAvailability = "coming-soon" | "available";
export type ToolIcon =
  | "image-compressor"
  | "image-resizer"
  | "image-converter"
  | "merge-pdf"
  | "split-pdf"
  | "images-to-pdf"
  | "pdf-to-jpg"
  | "qr-code"
  | "text-counter"
  | "percentage"
  | "unit-converter"
  | "date-calculator";

export interface ToolDefinition {
  id: string;
  slug: string;
  title: string;
  category: ToolCategory;
  description: string;
  searchKeywords: readonly string[];
  icon: ToolIcon;
  availability: ToolAvailability;
  href?: `/${string}`;
}

export const tools = [
  {
    id: "image-compressor",
    slug: "image-compressor",
    title: "Image Compressor",
    category: "image",
    description: "Compress JPG, PNG and WebP images directly in your browser. Adjust quality, compare file sizes, and download your optimized image.",
    searchKeywords: ["compress image", "reduce image size", "shrink photo", "optimize image", "jpg", "png"],
    icon: "image-compressor",
    availability: "available",
    href: "/tools/image-compressor",
  },
  {
    id: "image-resizer-cropper",
    slug: "image-resizer-cropper",
    title: "Image Resizer & Cropper",
    category: "image",
    description: "Resize and crop JPG, PNG and WebP images online for free. Choose custom dimensions, lock aspect ratio, and download your edited image.",
    searchKeywords: ["resize image", "crop image", "change picture size", "dimensions", "photo"],
    icon: "image-resizer",
    availability: "available",
    href: "/tools/image-resizer-cropper",
  },
  {
    id: "image-format-converter",
    slug: "image-converter",
    title: "JPG, PNG & WebP Image Converter",
    category: "image",
    description: "Convert JPG, PNG and WebP images online for free. Preview your image, choose the output format, and download the converted file instantly.",
    searchKeywords: ["convert image", "jpg to png", "png to jpg", "webp", "picture format"],
    icon: "image-converter",
    availability: "available",
    href: "/tools/image-converter",
  },
  {
    id: "merge-pdf",
    slug: "merge-pdf",
    title: "Merge PDF",
    category: "pdf",
    description: "Bring multiple PDF files together into one document.",
    searchKeywords: ["combine pdf", "join pdf", "pdf merger", "merge documents"],
    icon: "merge-pdf",
    availability: "coming-soon",
  },
  {
    id: "split-pdf",
    slug: "split-pdf",
    title: "Split PDF",
    category: "pdf",
    description: "Separate a PDF or extract the pages you need.",
    searchKeywords: ["extract pdf pages", "separate pdf", "divide pdf", "pdf splitter"],
    icon: "split-pdf",
    availability: "coming-soon",
  },
  {
    id: "images-to-pdf",
    slug: "images-to-pdf",
    title: "Images to PDF",
    category: "pdf",
    description: "Turn one or more image files into a PDF document.",
    searchKeywords: ["jpg to pdf", "png to pdf", "photos to pdf", "pictures to pdf", "image pdf"],
    icon: "images-to-pdf",
    availability: "coming-soon",
  },
  {
    id: "pdf-to-jpg",
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    category: "pdf",
    description: "Convert the pages in a PDF into JPG images.",
    searchKeywords: ["pdf to image", "pdf to jpeg", "pdf converter", "export pdf pages"],
    icon: "pdf-to-jpg",
    availability: "coming-soon",
  },
  {
    id: "qr-code-generator",
    slug: "qr-code-generator",
    title: "QR Code Generator",
    category: "utility",
    description: "Create QR codes for text and website links instantly. Customize the colors and size, then download your QR code as PNG or SVG.",
    searchKeywords: ["qr", "quick response code", "link to qr", "url qr", "barcode"],
    icon: "qr-code",
    availability: "available",
    href: "/tools/qr-code-generator",
  },
  {
    id: "word-character-counter",
    slug: "word-character-counter",
    title: "Word & Character Counter",
    category: "utility",
    description: "Count words, characters, and other useful text details.",
    searchKeywords: ["word count", "character count", "text counter", "letter count", "writing"],
    icon: "text-counter",
    availability: "available",
    href: "/tools/word-character-counter",
  },
  {
    id: "percentage-calculator",
    slug: "percentage-calculator",
    title: "Percentage Calculator",
    category: "utility",
    description: "Calculate percentages, find percentage changes, and increase or decrease numbers instantly with our free online percentage calculator.",
    searchKeywords: ["percent", "percentage change", "discount calculator", "increase", "decrease"],
    icon: "percentage",
    availability: "available",
    href: "/tools/percentage-calculator",
  },
  {
    id: "unit-converter",
    slug: "unit-converter",
    title: "Unit Converter",
    category: "utility",
    description: "Convert length, weight, temperature, area, volume, and time units instantly with our free online unit converter.",
    searchKeywords: ["measurement", "length", "weight", "mass", "temperature", "area", "volume", "time", "convert units"],
    icon: "unit-converter",
    availability: "available",
    href: "/tools/unit-converter",
  },
  {
    id: "date-difference-age-calculator",
    slug: "date-difference-age-calculator",
    title: "Date Difference & Age Calculator",
    category: "utility",
    description: "Calculate the difference between dates, your age, or days until a date with this free date calculator.",
    searchKeywords: ["date calculator", "days between dates", "age calculator", "time between", "birthday", "days until", "date difference"],
    icon: "date-calculator",
    availability: "available",
    href: "/tools/date-difference-age-calculator",
  },
] as const satisfies readonly ToolDefinition[];

export const toolCategories = {
  image: "Image Tools",
  pdf: "PDF Tools",
  utility: "Utilities",
} satisfies Record<ToolCategory, string>;
