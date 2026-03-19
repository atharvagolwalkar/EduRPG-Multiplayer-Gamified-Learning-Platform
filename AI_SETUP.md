## AI Integration (Free and Paid Options)

You can power the AI Dungeon Master with either a free Hugging Face model or a paid OpenAI model. The system will automatically use the best available option.

### Option 1: Hugging Face (Free - Recommended)

This is the recommended free option.

1.  **Get an API Key:**
    *   Go to the [Hugging Face settings page](https://huggingface.co/settings/tokens).
    *   Click "New token", give it a name (e.g., "EduRPG"), and assign it the "Read" role.
    *   Copy the generated token.

2.  **Set up Environment Variable:**
    *   Create a file named `.env` in the `backend` directory if it doesn't exist.
    *   Add the following line, replacing the placeholder with your key:
        ```
        HUGGINGFACE_API_KEY=your_hugging_face_api_key_here
        ```

### Option 2: OpenAI (Paid)

If you prefer to use OpenAI:

1.  **Get an API Key:**
    *   Go to the [OpenAI API keys page](https://platform.openai.com/account/api-keys).
    *   Create a new secret key.

2.  **Set up Environment Variable:**
    *   In the same `.env` file in the `backend` directory, add:
        ```
        OPENAI_API_KEY=your_openai_api_key_here
        ```

### How it Works

*   If a `HUGGINGFACE_API_KEY` is provided, the backend will **always** use the free Hugging Face model.
*   If the Hugging Face key is missing, it will look for an `OPENAI_API_KEY`.
*   If no keys are found, it will fall back to simple, mock AI responses for development.

