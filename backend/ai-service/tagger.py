import json
import re
import sys

import torch
from nudenet import NudeDetector
from paddleocr import PaddleOCR
from PIL import Image
from transformers import BlipForConditionalGeneration, BlipProcessor


class GifTagger:
    def __init__(self):
        # BLIP for image captioning
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = BlipProcessor.from_pretrained(
            "Salesforce/blip-image-captioning-base"
        )
        self.model = BlipForConditionalGeneration.from_pretrained(
            "Salesforce/blip-image-captioning-base"
        ).to(self.device)

        # PaddleOCR for text extraction
        self.ocr = PaddleOCR(
            use_angle_cls=True, lang="en", use_gpu=torch.cuda.is_available()
        )

        # NudeNet for NSFW detection
        self.nsfw_detector = NudeDetector()

    def extract_first_frame(self, gif_path):
        """Extract first frame from GIF"""
        img = Image.open(gif_path)
        return img.convert("RGB")

    def generate_caption(self, image):
        """Generate description using BLIP"""
        inputs = self.processor(image, return_tensors="pt").to(self.device)
        out = self.model.generate(**inputs, max_length=50)
        caption = self.processor.decode(out[0], skip_special_tokens=True)
        return caption

    def extract_text(self, image):
        """Extract text using OCR"""
        import numpy as np

        result = self.ocr.ocr(np.array(image), cls=True)
        texts = []
        if result and result[0]:
            for line in result[0]:
                texts.append(line[1][0])
        return " ".join(texts)

    def detect_nsfw(self, image_path):
        """Detect NSFW content"""
        detection = self.nsfw_detector.detect(image_path)
        # Check for explicit content
        nsfw_classes = [
            "FEMALE_GENITALIA_EXPOSED",
            "MALE_GENITALIA_EXPOSED",
            "ANUS_EXPOSED",
            "FEMALE_BREAST_EXPOSED",
        ]
        for det in detection:
            if det["class"] in nsfw_classes and det["score"] > 0.6:
                return True
        return False

    def caption_to_tags(self, caption, ocr_text):
        """Convert caption and OCR to tags"""
        # Combine caption and OCR text
        text = f"{caption} {ocr_text}".lower()

        # Remove common words
        stop_words = {
            "a",
            "an",
            "the",
            "is",
            "are",
            "was",
            "were",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
        }
        words = re.findall(r"\b[a-z]{3,}\b", text)
        tags = [w for w in words if w not in stop_words]

        # Remove duplicates, keep order
        seen = set()
        unique_tags = []
        for tag in tags:
            if tag not in seen:
                seen.add(tag)
                unique_tags.append(tag)

        return unique_tags[:15]  # Max 15 tags

    def tag_gif(self, gif_path):
        """Main tagging function"""
        try:
            # Extract first frame
            image = self.extract_first_frame(gif_path)

            # Generate caption
            caption = self.generate_caption(image)

            # Extract text
            ocr_text = self.extract_text(image)

            # Detect NSFW
            is_nsfw = self.detect_nsfw(gif_path)

            # Generate tags
            tags = self.caption_to_tags(caption, ocr_text)

            # Add NSFW tag if detected
            if is_nsfw and "nsfw" not in tags:
                tags.insert(0, "nsfw")

            # Ensure minimum 3 tags
            if len(tags) < 3:
                tags.extend(["gif", "animated", "image"][: 3 - len(tags)])

            return {
                "success": True,
                "tags": tags,
                "caption": caption,
                "ocr_text": ocr_text,
                "is_nsfw": is_nsfw,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)

    gif_path = sys.argv[1]
    tagger = GifTagger()
    result = tagger.tag_gif(gif_path)
    print(json.dumps(result))
