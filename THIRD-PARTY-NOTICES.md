# Third-party notices

The repository's MIT license applies to the project's original code and documentation. It does not grant trademark rights or relicense third-party assets.

- The Playground name, logo, and bundled brand imagery in `public/brand/`, including their appearance in README screenshots, retain their respective owners' rights.
- The bundled Manrope font is a third-party font. See the [bundled SIL Open Font License](public/brand/manrope-OFL.txt).
- The shared browser screenshot includes [Example Domain](https://example.com/), a public example page for documentation.
- Dependencies are subject to the licenses published by their respective authors.

- The hardware and developer logo packs use [Simple Icons v13.0.0](https://github.com/simple-icons/simple-icons/tree/13.0.0), distributed under CC0. Individual brands retain their trademark rights.

- The 3D reaction artwork is from [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji), bundled from Iconify's fluent-emoji 1.2.7 collection. See the [MIT license](public/reactions/packs/Fluent-LICENSE.txt).
- The developer meme pack uses [Egon Elbre’s Gophers](https://github.com/egonelbre/gophers/tree/63b1f5a9f334f9e23735c6e09ac003479ffe5df5), released under CC0. The original Go gopher was designed by Renée French.

- The 100 captioned People & punchlines, City postcards and Meeting memes stickers use Wikimedia Commons imagery. The [photo sticker credits](public/reactions/photos/credits.html) identify the source, author and license for each image.

## On-device camera background blur

Camera blur uses the Apache 2.0 [LiveKit track processors](https://github.com/livekit/track-processors-js) and [Google MediaPipe](https://github.com/google-ai-edge/mediapipe). The bundled camera model is Google’s [Selfie Segmenter, float16 version 1](https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite). Google describes its training data and intended use in the [model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Selfie%20Segmentation.pdf).

## On-device speech recognition

Local caption translation uses the University of Helsinki’s OPUS-MT models and Xenova’s quantized ONNX conversions. The upstream model cards for [Spanish](https://huggingface.co/Helsinki-NLP/opus-mt-en-es), [French](https://huggingface.co/Helsinki-NLP/opus-mt-en-fr), [Hindi](https://huggingface.co/Helsinki-NLP/opus-mt-en-hi), [Portuguese (ROMANCE)](https://huggingface.co/Helsinki-NLP/opus-mt-en-ROMANCE), and [Chinese](https://huggingface.co/Helsinki-NLP/opus-mt-en-zh) identify the Apache 2.0 license. The [German model](https://huggingface.co/Helsinki-NLP/opus-mt-en-de) is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The [asset manifest](scripts/translation-models.json) identifies each conversion, revision, and digest.

Whisper mode uses [OpenAI Whisper Base English](https://github.com/openai/whisper) under the [MIT License](public/speech/LICENSE-Whisper.txt), with [Xenova’s quantized ONNX weights](https://huggingface.co/Xenova/whisper-base.en). The app serves the [Transformers.js](https://github.com/huggingface/transformers.js) browser runtime ([Apache 2.0](public/speech/LICENSE-Transformers.txt)) and [ONNX Runtime](https://onnxruntime.ai/) ([MIT](public/speech/LICENSE-ONNX-Runtime.txt), [third-party notices](public/speech/ONNX-ThirdPartyNotices.txt)). Setup verifies the pinned assets before serving them.

The browser runtime uses [Vosk-Browser](https://github.com/ccoreilly/vosk-browser) by Ciaran O’Reilly, built on [Vosk](https://github.com/alphacep/vosk-api). The bundled [vosk-model-small-en-us-0.15](https://alphacephei.com/vosk/models) from Alpha Cephei is repackaged from ZIP to tar.gz for the browser. The runtime and model are distributed under the [Apache License 2.0](public/speech/LICENSE-Vosk.txt).
