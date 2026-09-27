import re
import math
from typing import List, Dict, Any

# Common formulaic transitions, cliches, and markers characteristic of LLM generation
FORMULAIC_MARKERS = [
    (r"\b(it is (important|crucial|essential|worth noting) to (remember|note|understand))\b", "Formulaic introductory clause"),
    (r"\b(delve(s)? into|delving into)\b", "Stereotypical AI verb pattern"),
    (r"\b(plays a (pivotal|crucial|vital|significant) role in)\b", "Formulaic importance framing"),
    (r"\b(testament to|rich tapestry|vibrant tapestry|tapestry of)\b", "Formulaic metaphorical idiom"),
    (r"\b(in conclusion|in summary|to summarize|overall, it is evident)\b", "Formulaic discourse summary"),
    (r"\b(navigat(e|ing|es) the (complexities|landscape) of)\b", "Common AI transition phrase"),
    (r"\b(beacon of|cornerstone of|at the forefront of)\b", "Stereotypical rhetorical flourish"),
    (r"\b(serves as a (reminder|testament|foundation))\b", "Repetitive explanatory cadence"),
    (r"\b(not only .+ but also .+)\b", "Balanced parallel structure"),
    (r"\b(moreover|furthermore|consequently|additionally|in essence)\b", "High transition marker density"),
    (r"\b(underscores the importance|highlights the need for)\b", "Formulaic analytical marker"),
    (r"\b(a wide (range|variety|array) of)\b", "Formulaic generic grouping"),
]

def split_into_sentences(text: str) -> List[Dict[str, Any]]:
    """Splits text into sentences while retaining exact start and end offsets in original text."""
    sentences = []
    # Match sentences ending with . ! ? or end of string, avoiding common abbreviations
    pattern = re.compile(r'([^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$)')
    
    for match in pattern.finditer(text):
        s_text = match.group().strip()
        if len(s_text) > 3:  # ignore tiny whitespace or punctuation artifacts
            # Find exact position in text
            start = match.start()
            # adjust start for leading whitespace
            while start < len(text) and text[start].isspace():
                start += 1
            end = start + len(s_text)
            sentences.append({
                "text": s_text,
                "start": start,
                "end": end
            })
    return sentences

def analyze_linguistic_patterns(text: str) -> Dict[str, Any]:
    """
    Performs analytical NLP & statistical examination of text for characteristics 
    frequently associated with AI generation:
    1. Uniform sentence length and low cadence burstiness
    2. High density of formulaic discourse cliches and markers
    3. High structural regularity and repetitive grammatical openers
    4. Lexical predictability
    """
    if not text or len(text.strip()) < 10:
        return {
            "ai_likelihood": 0,
            "human_likelihood": 100,
            "level": "low",
            "level_label": "LOW AI-RELATED INDICATORS",
            "signals": [],
            "stats": {
                "sentence_count": 0,
                "word_count": 0,
                "avg_sentence_length": 0,
                "burstiness_variance": 0
            }
        }

    sentences = split_into_sentences(text)
    if not sentences:
        return {
            "ai_likelihood": 5,
            "human_likelihood": 95,
            "level": "low",
            "level_label": "LOW AI-RELATED INDICATORS",
            "signals": [],
            "stats": {"sentence_count": 0, "word_count": len(text.split())}
        }

    # Sentence length statistics (word count per sentence)
    lengths = [len(s["text"].split()) for s in sentences]
    avg_len = sum(lengths) / len(lengths)
    variance = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)
    std_dev = math.sqrt(variance)
    # Burstiness coefficient: lower variance relative to mean indicates uniform machine-like cadence
    burstiness = std_dev / (avg_len + 1e-5)

    signals = []
    sentence_scores = []
    starter_counts = {}

    for s_idx, s in enumerate(sentences):
        s_text = s["text"]
        words = s_text.split()
        score = 0
        reasons = []

        # Check starter regularity (e.g. multiple sentences starting with It / This / The / In addition)
        if words:
            starter = words[0].lower()
            starter_counts[starter] = starter_counts.get(starter, 0) + 1
            if starter in ["furthermore,", "moreover,", "additionally,", "in", "it", "this"]:
                score += 15
                reasons.append("Formulaic sentence opener")

        # Check formulaic markers
        for regex, label in FORMULAIC_MARKERS:
            if re.search(regex, s_text, re.IGNORECASE):
                score += 25
                if label not in reasons:
                    reasons.append(label)

        # Check cadence regularity (uniform 15-25 word complex sentence without dialogue or contractions)
        if 16 <= len(words) <= 28 and "," in s_text and "n't" not in s_text.lower():
            score += 18
            if "Uniform structural cadence" not in reasons:
                reasons.append("High structural regularity")

        # Check balanced parallel structures or repeated passive phrasing
        if re.search(r"\b(is|are|was|were) (designed|developed|used|implemented|considered) to\b", s_text, re.IGNORECASE):
            score += 15
            if "Passive explanatory construct" not in reasons:
                reasons.append("Passive explanatory construct")

        if len(words) > 35:
            # Overly long run-on
            score += 10

        # Classify sentence level
        if score >= 35 or len(reasons) >= 2:
            sig_level = "high"
            primary_reason = reasons[0] if reasons else "Formulaic wording"
        elif score >= 20:
            sig_level = "moderate"
            primary_reason = reasons[0] if reasons else "Possible structural regularity"
        else:
            sig_level = "normal"
            primary_reason = "No significant indicator"

        sentence_scores.append(score)

        if sig_level in ["high", "moderate"]:
            signals.append({
                "text": s_text,
                "start": s["start"],
                "end": s["end"],
                "level": sig_level,
                "score": score,
                "reason": primary_reason,
                "all_reasons": reasons
            })

    # Overall calculation
    # Proportion of flagged sentences
    flagged_ratio = len(signals) / max(len(sentences), 1)
    
    # Low burstiness (monotonous length) pushes score higher
    cadence_penalty = 0
    if burstiness < 0.35 and len(sentences) >= 3:
        cadence_penalty = 20
    elif burstiness < 0.5 and len(sentences) >= 3:
        cadence_penalty = 10

    # Calculate overall AI likelihood percentage (0 - 100)
    base_estimate = (flagged_ratio * 75) + cadence_penalty
    
    # Cap and round to realistic analytical integer
    ai_likelihood = max(5, min(96, int(round(base_estimate))))
    human_likelihood = 100 - ai_likelihood

    if ai_likelihood >= 65:
        level = "elevated"
        level_label = "ELEVATED AI-RELATED INDICATORS"
    elif ai_likelihood >= 35:
        level = "moderate"
        level_label = "MODERATE AI-RELATED INDICATORS"
    else:
        level = "low"
        level_label = "LOW AI-RELATED INDICATORS"

    return {
        "ai_likelihood": ai_likelihood,
        "human_likelihood": human_likelihood,
        "level": level,
        "level_label": level_label,
        "signals": signals,
        "explanation": "This is an analytical estimate based on linguistic characteristics such as cadence regularity and formulaic discourse structures. It is not definitive proof of AI authorship.",
        "stats": {
            "sentence_count": len(sentences),
            "word_count": len(text.split()),
            "avg_sentence_length": round(avg_len, 1),
            "burstiness": round(burstiness, 2),
            "flagged_sentence_count": len(signals)
        }
    }
