import os
import zipfile
import re
import xml.etree.ElementTree as ET
from datetime import datetime
import pymupdf
import docx
import pptx

def format_date(val):
    if not val:
        return "Not available"
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d %H:%M:%S")
    # If it's a PDF date string like D:20260812153020+05'30'
    if isinstance(val, str) and val.startswith("D:"):
        match = re.match(r"D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?", val)
        if match:
            parts = match.groups()
            y, m, d = parts[0], parts[1], parts[2]
            h = parts[3] or "00"
            mi = parts[4] or "00"
            s = parts[5] or "00"
            return f"{y}-{m}-{d} {h}:{mi}:{s}"
    return str(val)


def extract_app_properties_from_ooxml(file_path):
    """Extract properties like Company, Application, Manager from docProps/app.xml in DOCX or PPTX."""
    props = {}
    try:
        with zipfile.ZipFile(file_path, "r") as z:
            if "docProps/app.xml" in z.namelist():
                xml_data = z.read("docProps/app.xml")
                root = ET.fromstring(xml_data)
                # XML namespace is usually http://schemas.openxmlformats.org/officeDocument/2006/extended-properties
                for elem in root:
                    tag = elem.tag.split("}")[-1]  # remove namespace
                    if tag in ["Application", "Company", "Manager", "Template", "TotalTime", "AppVersion"]:
                        if elem.text and elem.text.strip():
                            props[tag] = elem.text.strip()
    except Exception as e:
        print(f"Error reading app.xml: {e}")
    return props


def clean_ooxml_file(source_path, target_path, keys_to_remove, is_docx=True):
    """
    Cleans an OOXML file (DOCX/PPTX) by:
    1. Using python-docx or python-pptx to clean core_properties
    2. Modifying docProps/app.xml and removing docProps/custom.xml in the zip package
    """
    temp_saved_path = target_path + ".temp"

    if is_docx:
        doc = docx.Document(source_path)
        cp = doc.core_properties
        # Map of keys to core properties
        core_map = {
            "Author": "author",
            "Last Modified By": "last_modified_by",
            "Title": "title",
            "Subject": "subject",
            "Category": "category",
            "Comments": "comments",
            "Keywords": "keywords",
        }
        for display_name, attr_name in core_map.items():
            if display_name in keys_to_remove or attr_name in keys_to_remove:
                try:
                    setattr(cp, attr_name, "")
                except Exception:
                    pass
        if "Created Date" in keys_to_remove or "created" in keys_to_remove:
            try:
                cp.created = None
            except Exception:
                pass
        if "Modified Date" in keys_to_remove or "modified" in keys_to_remove:
            try:
                cp.modified = None
            except Exception:
                pass
        if "Revision" in keys_to_remove or "revision" in keys_to_remove:
            try:
                cp.revision = 1
            except Exception:
                pass
        doc.save(temp_saved_path)

    else:
        prs = pptx.Presentation(source_path)
        cp = prs.core_properties
        core_map = {
            "Author": "author",
            "Last Modified By": "last_modified_by",
            "Title": "title",
            "Subject": "subject",
            "Category": "category",
            "Comments": "comments",
            "Keywords": "keywords",
        }
        for display_name, attr_name in core_map.items():
            if display_name in keys_to_remove or attr_name in keys_to_remove:
                try:
                    setattr(cp, attr_name, "")
                except Exception:
                    pass
        if "Created Date" in keys_to_remove or "created" in keys_to_remove:
            try:
                cp.created = None
            except Exception:
                pass
        if "Modified Date" in keys_to_remove or "modified" in keys_to_remove:
            try:
                cp.modified = None
            except Exception:
                pass
        if "Revision" in keys_to_remove or "revision" in keys_to_remove:
            try:
                cp.revision = 1
            except Exception:
                pass
        prs.save(temp_saved_path)

    # Now inspect and clean app.xml and custom.xml directly in the zip archive
    app_tags_to_wipe = []
    if "Company" in keys_to_remove:
        app_tags_to_wipe.append("Company")
    if "Application" in keys_to_remove:
        app_tags_to_wipe.append("Application")
    if "Manager" in keys_to_remove:
        app_tags_to_wipe.append("Manager")

    # If any app tags need wiping or we just want to rebuild clean zip
    with zipfile.ZipFile(temp_saved_path, "r") as zin:
        with zipfile.ZipFile(target_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename == "docProps/app.xml" and app_tags_to_wipe:
                    try:
                        root = ET.fromstring(data)
                        for elem in root:
                            tag = elem.tag.split("}")[-1]
                            if tag in app_tags_to_wipe:
                                elem.text = ""
                        data = ET.tostring(root, encoding="utf-8", xml_declaration=True)
                    except Exception as e:
                        print(f"Error wiping app tags: {e}")
                elif item.filename == "docProps/custom.xml" and "Custom Properties" in keys_to_remove:
                    # skip custom properties
                    continue
                zout.writestr(item, data)

    if os.path.exists(temp_saved_path):
        os.remove(temp_saved_path)


class DocumentProcessor:

    @staticmethod
    def inspect(file_path: str, file_type: str):
        """
        Inspects the document and returns:
        - metadata_list: list of dicts { 'key': str, 'value': str, 'removable': bool, 'in_doc': bool }
        - extracted_text: str (visible content preview)
        - file_info: dict with basic file details
        """
        metadata_list = []
        extracted_text = ""
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

        ft = file_type.upper()

        if ft == "PDF":
            metadata_list, extracted_text = DocumentProcessor._inspect_pdf(file_path)
        elif ft == "DOCX":
            metadata_list, extracted_text = DocumentProcessor._inspect_docx(file_path)
        elif ft == "PPTX":
            metadata_list, extracted_text = DocumentProcessor._inspect_pptx(file_path)
        elif ft == "TXT":
            metadata_list, extracted_text = DocumentProcessor._inspect_txt(file_path, file_size)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        return metadata_list, extracted_text

    @staticmethod
    def _inspect_pdf(file_path: str):
        metadata_list = []
        text_content = []

        doc = pymupdf.open(file_path)
        meta = doc.metadata or {}

        # Standard PDF metadata fields
        fields = [
            ("Author", meta.get("author")),
            ("Title", meta.get("title")),
            ("Subject", meta.get("subject")),
            ("Keywords", meta.get("keywords")),
            ("Creator", meta.get("creator")),
            ("Producer", meta.get("producer")),
            ("Creation Date", format_date(meta.get("creationDate"))),
            ("Modification Date", format_date(meta.get("modDate"))),
            ("Format", meta.get("format")),
            ("Trapped", meta.get("trapped")),
            ("Encryption", meta.get("encryption")),
        ]

        for key, val in fields:
            display_val = val if (val is not None and str(val).strip() != "") else "Not available"
            is_removable = key not in ["Format", "Encryption"] and display_val != "Not available"
            metadata_list.append({
                "key": key,
                "value": display_val,
                "removable": is_removable
            })

        # Check for embedded XML/XMP metadata
        has_xml = False
        try:
            xmp = doc.get_xml_metadata()
            if xmp and len(xmp.strip()) > 0:
                has_xml = True
        except Exception:
            pass

        if has_xml:
            metadata_list.append({
                "key": "XMP Metadata Stream",
                "value": "Detected embedded XMP stream",
                "removable": True
            })

        # Extract visible text per page
        for page_num in range(min(len(doc), 50)):  # Read up to 50 pages for preview
            page = doc[page_num]
            text = page.get_text()
            if text.strip():
                text_content.append(f"--- Page {page_num + 1} ---\n" + text.strip())

        extracted_text = "\n\n".join(text_content) if text_content else "[No selectable visible text found in PDF pages]"
        doc.close()
        return metadata_list, extracted_text

    @staticmethod
    def _inspect_docx(file_path: str):
        metadata_list = []
        doc = docx.Document(file_path)
        cp = doc.core_properties
        app_props = extract_app_properties_from_ooxml(file_path)

        fields = [
            ("Author", cp.author),
            ("Last Modified By", cp.last_modified_by),
            ("Title", cp.title),
            ("Subject", cp.subject),
            ("Company", app_props.get("Company")),
            ("Application", app_props.get("Application")),
            ("Creation Date", format_date(cp.created)),
            ("Modification Date", format_date(cp.modified)),
            ("Revision", str(cp.revision) if cp.revision is not None else None),
            ("Category", cp.category),
            ("Keywords", cp.keywords),
            ("Comments", cp.comments),
        ]

        for key, val in fields:
            display_val = val if (val is not None and str(val).strip() != "") else "Not available"
            is_removable = display_val != "Not available"
            metadata_list.append({
                "key": key,
                "value": display_val,
                "removable": is_removable
            })

        # Extract visible text from paragraphs and tables
        text_lines = []
        for p in doc.paragraphs:
            if p.text.strip():
                text_lines.append(p.text)
        
        for table in doc.tables:
            table_rows = []
            for row in table.rows:
                cells = [c.text.strip() for c in row.cells]
                table_rows.append(" | ".join(cells))
            if table_rows:
                text_lines.append("\n[Table Content]:\n" + "\n".join(table_rows))

        extracted_text = "\n\n".join(text_lines) if text_lines else "[Empty document or no text paragraphs found]"
        return metadata_list, extracted_text

    @staticmethod
    def _inspect_pptx(file_path: str):
        metadata_list = []
        prs = pptx.Presentation(file_path)
        cp = prs.core_properties
        app_props = extract_app_properties_from_ooxml(file_path)

        fields = [
            ("Author", cp.author),
            ("Last Modified By", cp.last_modified_by),
            ("Title", cp.title),
            ("Subject", cp.subject),
            ("Company", app_props.get("Company")),
            ("Application", app_props.get("Application")),
            ("Creation Date", format_date(cp.created)),
            ("Modification Date", format_date(cp.modified)),
            ("Revision", str(cp.revision) if cp.revision is not None else None),
            ("Category", cp.category),
            ("Keywords", cp.keywords),
            ("Comments", cp.comments),
        ]

        for key, val in fields:
            display_val = val if (val is not None and str(val).strip() != "") else "Not available"
            is_removable = display_val != "Not available"
            metadata_list.append({
                "key": key,
                "value": display_val,
                "removable": is_removable
            })

        # Extract visible slide text
        slide_texts = []
        for idx, slide in enumerate(prs.slides):
            slide_content = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        txt = "".join(run.text for run in paragraph.runs).strip()
                        if txt:
                            slide_content.append(txt)
                elif shape.has_table:
                    for row in shape.table.rows:
                        cells = [c.text.strip() for c in row.cells if c.text.strip()]
                        if cells:
                            slide_content.append(" | ".join(cells))
            if slide_content:
                slide_texts.append(f"--- Slide {idx + 1} ---\n" + "\n".join(slide_content))
            else:
                slide_texts.append(f"--- Slide {idx + 1} --- (Empty or Graphic slide)")

        extracted_text = "\n\n".join(slide_texts) if slide_texts else "[No slides or text shapes found in presentation]"
        return metadata_list, extracted_text

    @staticmethod
    def _inspect_txt(file_path: str, file_size: int):
        metadata_list = []
        extracted_text = ""
        encoding_detected = "UTF-8"

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                extracted_text = f.read()
        except UnicodeDecodeError:
            try:
                with open(file_path, "r", encoding="latin-1") as f:
                    extracted_text = f.read()
                encoding_detected = "Latin-1"
            except Exception:
                extracted_text = "[Could not decode file content]"
                encoding_detected = "Unknown"

        line_count = len(extracted_text.splitlines())
        char_count = len(extracted_text)
        word_count = len(extracted_text.split())

        metadata_list.append({
            "key": "File Encoding",
            "value": encoding_detected,
            "removable": False
        })
        metadata_list.append({
            "key": "Line Count",
            "value": str(line_count),
            "removable": False
        })
        metadata_list.append({
            "key": "Word Count",
            "value": str(word_count),
            "removable": False
        })
        metadata_list.append({
            "key": "Character Count",
            "value": str(char_count),
            "removable": False
        })
        metadata_list.append({
            "key": "Author / Document Properties",
            "value": "Not available (Plain text format does not store embedded metadata properties)",
            "removable": False
        })

        return metadata_list, extracted_text

    @staticmethod
    def clean(file_path: str, file_type: str, cleaned_path: str, keys_to_remove: list):
        """
        Performs the genuine metadata removal on the file and saves it to cleaned_path.
        Returns the before/after metadata comparison dictionary.
        """
        ft = file_type.upper()
        # Get before state
        before_meta, _ = DocumentProcessor.inspect(file_path, file_type)
        before_dict = {item["key"]: item["value"] for item in before_meta}

        if ft == "PDF":
            DocumentProcessor._clean_pdf(file_path, cleaned_path, keys_to_remove)
        elif ft == "DOCX":
            clean_ooxml_file(file_path, cleaned_path, keys_to_remove, is_docx=True)
        elif ft == "PPTX":
            clean_ooxml_file(file_path, cleaned_path, keys_to_remove, is_docx=False)
        elif ft == "TXT":
            DocumentProcessor._clean_txt(file_path, cleaned_path, keys_to_remove)
        else:
            raise ValueError(f"Cannot clean unsupported format: {file_type}")

        # Get after state
        after_meta, _ = DocumentProcessor.inspect(cleaned_path, file_type)
        after_dict = {item["key"]: item["value"] for item in after_meta}

        # Build clean audit summary
        summary = {
            "before": before_dict,
            "after": after_dict,
            "removed_keys": keys_to_remove
        }
        return summary

    @staticmethod
    def _clean_pdf(source_path: str, target_path: str, keys_to_remove: list):
        doc = pymupdf.open(source_path)

        # Mapping for PDF metadata dict
        pdf_key_map = {
            "Author": "author",
            "Title": "title",
            "Subject": "subject",
            "Keywords": "keywords",
            "Creator": "creator",
            "Producer": "producer",
            "Creation Date": "creationDate",
            "Modification Date": "modDate",
            "Trapped": "trapped"
        }

        current_meta = dict(doc.metadata or {})
        for display_name, internal_key in pdf_key_map.items():
            if display_name in keys_to_remove or internal_key in keys_to_remove:
                current_meta[internal_key] = ""

        # If user selected remove all or specific ones
        doc.set_metadata(current_meta)

        if "XMP Metadata Stream" in keys_to_remove or "All Metadata" in keys_to_remove:
            try:
                doc.del_xml_metadata()
            except Exception:
                pass

        # Save with clean=True, deflate=True, garbage=4 to eliminate orphaned and revision metadata objects
        doc.save(target_path, clean=True, deflate=True, garbage=4)
        doc.close()

    @staticmethod
    def _clean_txt(source_path: str, target_path: str, keys_to_remove: list):
        # Plain text: clean trailing whitespaces or ensure clean UTF-8 without BOM
        with open(source_path, "rb") as fin:
            content = fin.read()
        # Remove UTF-8 BOM if present
        if content.startswith(b"\xef\xbb\xbf"):
            content = content[3:]
        with open(target_path, "wb") as fout:
            fout.write(content)
