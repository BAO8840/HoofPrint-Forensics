import os
import cloudinary
import cloudinary.uploader

_configured = False


def _configure_once():
    global _configured
    if _configured:
        return
    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
        secure=True,
    )
    _configured = True


def upload_hoofprint_image(file_bytes: bytes, filename: str) -> dict:
    """Uploads an evidence image to Cloudinary under the hoofprints/ folder.
    Returns {"url": secure_url, "public_id": public_id}.
    """
    _configure_once()
    result = cloudinary.uploader.upload(
        file_bytes,
        folder="hoofprints",
        public_id=os.path.splitext(filename)[0],
        unique_filename=True,
        overwrite=False,
        resource_type="image",
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}
