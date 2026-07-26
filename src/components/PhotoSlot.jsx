import { CameraIcon } from "./Icons.jsx";
import { resizeImage } from "../lib/image.js";

export default function PhotoSlot({ slotKey, title, hint, capture, value, onChange }) {
  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file, 480, 0.6);
      onChange(slotKey, dataUrl);
    } catch {
      onChange(slotKey, null);
    }
  }

  return (
    <div className={`photo-slot ${value ? "filled" : ""}`}>
      {value ? (
        <img className="photo-preview" src={value} alt={title} />
      ) : (
        <div className="photo-placeholder">
          <CameraIcon width="22" height="22" />
        </div>
      )}
      <div className="stitle">{title}</div>
      <div className="shint">{hint}</div>
      <label className="upload-btn">
        {value ? "Cambiar foto" : "Subir foto"}
        <input type="file" accept="image/*" capture={capture} onChange={handleFile} />
      </label>
    </div>
  );
}
