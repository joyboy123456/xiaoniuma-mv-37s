import sys, json
from faster_whisper import WhisperModel
size = sys.argv[1] if len(sys.argv) > 1 else "small"
m = WhisperModel(size, device="cpu", compute_type="int8")
segs, info = m.transcribe("/Volumes/DevDisk/给Claude的独立创作包-小牛马37秒/assets/song_37s.m4a",
    language="zh", word_timestamps=True, vad_filter=False, beam_size=5,
    initial_prompt="小牛马七点起，慌慌张张急急忙忙上班去。一月工资三千一，却想攒够一个亿。什么刮风下雨，什么高温天气。")
out = []
for s in segs:
    out.append({"start": s.start, "end": s.end, "text": s.text,
                "words": [{"w": w.word, "s": w.start, "e": w.end, "p": w.probability} for w in (s.words or [])]})
    print(f"{s.start:6.2f}-{s.end:6.2f} {s.text}", flush=True)
json.dump(out, open(f"/Volumes/DevDisk/给Claude的独立创作包-小牛马37秒/work/asr/fw_{size}.json", "w"), ensure_ascii=False, indent=1)
print("DONE")
