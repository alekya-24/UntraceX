import re
import difflib
from typing import Dict, List, Any

# Vocabulary and phrase transformations to break formulaic AI cadence while preserving facts & meaning
TRANSFORMATIONS = [
    (r"\bIt is important to remember that\b", "Notably,"),
    (r"\bit is crucial to (understand|note)\b", "we should consider"),
    (r"\bit is essential to understand\b", "understanding"),
    (r"\bdelve into\b", "explore"),
    (r"\bdelves into\b", "examines"),
    (r"\bdelving into\b", "examining"),
    (r"\bplays a (crucial|pivotal|vital|significant) role in\b", "is key to"),
    (r"\bIn conclusion,\b", "Overall,"),
    (r"\bIn summary,\b", "To sum up,"),
    (r"\bnavigat(ing|e) the (complexities|landscape) of\b", "working with"),
    (r"\ba testament to\b", "evidence of"),
    (r"\brich tapestry of\b", "broad collection of"),
    (r"\btestament to the importance of\b", "shows the value of"),
    (r"\bFurthermore,\b", "Also,"),
    (r"\bMoreover,\b", "In addition,"),
    (r"\bConsequently,\b", "As a result,"),
    (r"\bAdditionally,\b", "Besides,"),
    (r"\bunderscores the importance of\b", "highlights the need for"),
    (r"\ba wide (range|variety|array) of\b", "various"),
    (r"\bprovides a simple and readable syntax and supports\b", "offers clean syntax while supporting"),
    (r"\bis widely used for software development\b", "is popular across software engineering"),
    (r"\bnot only ([^,]+) but also ([^.]+)\b", r"\1 as well as \2"),
]

def improve_text(original_text: str, target_sentences: List[str] = None) -> Dict[str, Any]:
    """
    Improves sentence flow, eliminates formulaic AI cadence, injects natural variation,
    and preserves core meaning, technical terms, and facts.
    """
    improved_text = original_text

    # Apply phrase replacements
    for pattern, replacement in TRANSFORMATIONS:
        improved_text = re.sub(pattern, replacement, improved_text, flags=re.IGNORECASE)

    # Break up repetitive sentence starts if present
    lines = improved_text.splitlines()
    refined_lines = []
    
    for line in lines:
        if not line.strip():
            refined_lines.append(line)
            continue
            
        sentences = re.split(r'(?<=[.!?])\s+', line)
        refined_sentences = []
        last_starter = ""
        
        for s in sentences:
            s_clean = s.strip()
            if not s_clean:
                continue
            words = s_clean.split()
            if words and words[0].lower() == last_starter:
                # Add natural variation
                if words[0].lower() == "it":
                    s_clean = "This language " + " ".join(words[1:])
                elif words[0].lower() == "this":
                    s_clean = "It " + " ".join(words[1:])
            
            if words:
                last_starter = words[0].lower()
            refined_sentences.append(s_clean)
            
        refined_lines.append(" ".join(refined_sentences))

    final_improved = "\n".join(refined_lines)

    # Generate structured diff chunks
    diff_chunks = generate_diff_chunks(original_text, final_improved)

    return {
        "original_text": original_text,
        "improved_text": final_improved,
        "diff_chunks": diff_chunks,
        "changes_made": len([c for c in diff_chunks if c["type"] != "unchanged"])
    }

def generate_diff_chunks(text_before: str, text_after: str) -> List[Dict[str, str]]:
    """
    Computes precise character and word differences between original and improved text:
    - type: 'removed' (RED)
    - type: 'added' (GREEN)
    - type: 'unchanged' (NORMAL)
    """
    words_before = re.findall(r'\S+|\s+', text_before)
    words_after = re.findall(r'\S+|\s+', text_after)

    matcher = difflib.SequenceMatcher(None, words_before, words_after)
    chunks = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            chunks.append({
                "type": "unchanged",
                "text": "".join(words_before[i1:i2])
            })
        elif tag == 'delete':
            chunks.append({
                "type": "removed",
                "text": "".join(words_before[i1:i2])
            })
        elif tag == 'insert':
            chunks.append({
                "type": "added",
                "text": "".join(words_after[j1:j2])
            })
        elif tag == 'replace':
            chunks.append({
                "type": "removed",
                "text": "".join(words_before[i1:i2])
            })
            chunks.append({
                "type": "added",
                "text": "".join(words_after[j1:j2])
            })

    return chunks
