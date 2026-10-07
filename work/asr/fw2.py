import sys, json
from faster_whisper import WhisperModel
mode = sys.argv[1]
m = WhisperModel("/Volumes/DevDisk/给Claude的独立创作包-小牛马37秒/work/asr/fw-small", device="cpu", compute_type="int8")
lyr = open("/Volumes/DevDisk/给Claude的独立创作包-小牛马37秒/lyrics.txt").read().replace("\n\n","\n").strip().split("\n")
prompt = "，".join(lyr) if mode == "prompt" else None
segs, info = m.transcribe("/Volumes/DevDisk/给Claude的独立创作包-小牛马37秒/assets/song_37s.m4a",
    language="zh", word_timestamps=True, vad_filter=False, beam_size=5, initial_prompt=prompt, condition_on_previous_text=False)
out = []
for s in segs:
    out.append({"start": s.start, "end": s.end, "text": s.text,
                "words": [{"w": w.word, "s": round(w.start,3), "e": round(w.end,3), "p": round(w.probability,3)} for w in (s.words or [])]})
    print(f"{s.start:6.2f}-{s.end:6.2f} {s.text}", flush=True)
    print("    " + " ".join(f"{w.word}[{w.start:.2f}-{w.end:.2f}]" for w in (s.words or [])), flush=True)
json.dump(out, open(f"fw_{mode}.json", "w"), ensure_ascii=False, indent=1)
