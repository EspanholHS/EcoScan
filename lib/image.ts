export async function prepareImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error(
      "Escolha uma imagem JPG, PNG ou WebP. Se estiver em HEIC, exporte como JPG.",
    );
  if (file.size > 12 * 1024 * 1024)
    throw new Error(
      "A fotografia deve ter até 12 MB. Escolha uma versão menor.",
    );
  if (!file.size)
    throw new Error("Este arquivo está vazio. Escolha outra fotografia.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Não foi possível abrir essa imagem. Tente outro arquivo.");
  }
  try {
    if (
      bitmap.width < 32 ||
      bitmap.height < 32 ||
      bitmap.width * bitmap.height > 25_000_000
    )
      throw new Error("Use uma fotografia entre 32 pixels e 25 megapixels.");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Seu navegador não conseguiu preparar a fotografia.");
    context.fillStyle = "#f5f3ed";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error("Não foi possível preparar esta imagem.")),
        "image/jpeg",
        0.82,
      ),
    );
    if (blob.size > 2_000_000)
      throw new Error(
        "A imagem ainda está muito grande. Envie uma foto menor.",
      );
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(new Error("Erro ao ler a fotografia."));
      reader.readAsDataURL(blob);
    });
    return {
      preview: URL.createObjectURL(blob),
      base64,
      mimeType: "image/jpeg" as const,
      name: file.name,
    };
  } finally {
    bitmap.close();
  }
}
