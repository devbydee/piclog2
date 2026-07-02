const passwordInput = document.getElementById("password");
const imageInput = document.getElementById("image-url");
const button = document.getElementById("post-btn");
const message = document.getElementById("message");
const preview = document.getElementById("preview");

imageInput.addEventListener("input", () => {
  const url = imageInput.value.trim();

  if (!url) {
    preview.removeAttribute("src");
    preview.style.display = "none";
    return;
  }

  preview.src = url;
  preview.style.display = "block";
});

button.addEventListener("click", async () => {
  const password = passwordInput.value.trim();
  const imageUrl = imageInput.value.trim();

  message.textContent = "";

  if (!password) {
    message.textContent = "enter the password first.";
    return;
  }

  if (!imageUrl) {
    message.textContent = "paste an image url first.";
    return;
  }

  button.disabled = true;
  button.textContent = "saving...";

  try {
    const response = await fetch("/.netlify/functions/update-piclog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password, imageUrl })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "something went wrong");
    }

    message.textContent = "saved. refresh your Neocities page in a few seconds.";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "update piclog";
  }
});
