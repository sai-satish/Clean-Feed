# 🧠 AI-Based Content Personalization by Facial Age Estimation

An AI-powered platform designed to deliver **age-appropriate content** by combining facial age detection, hybrid recommendation systems, and intelligent moderation. Built with privacy in mind, this project creates a **safer and more personalized web experience**, especially for minors.

---

## 📌 About the Project

Today's digital platforms expose users—especially children—to inappropriate content due to ineffective age filtering. Most solutions either rely on self-declared ages or disconnected moderation systems.

This project unifies:

- 🔍 Real-time **Facial Age Estimation**
- 🎯 **Hybrid Recommendation System** (Content-Based + Collaborative Filtering)
- 🧼 **Smart Content Moderation**

...all in a privacy-preserving architecture that meets modern compliance standards like **COPPA** and **GDPR**.

---

## 🔑 Key Features

- 🧠 **Real-Time Facial Age Detection** using deep learning
- 🧼 **Content Moderation** powered by transformer-based NLP
- 🔐 **Privacy-first design** with ephemeral face data handling
- 📦 **Hybrid Recommender** mitigates cold start + overspecialization
- 📸 **Camera-based Age Verification** via `getUserMedia`
- 🖼️ **Modern UI** built with TailwindCSS and React
- 📊 **User Dashboards**, Profiles, and Reels display
- 🔁 Extensible for E-learning, OTT, and E-commerce

---

## 📂 Datasets Used

### 👶 Age Estimation Dataset
- **Name:** Adience Benchmark (Gender and Age Classification)
- **Link:** [https://www.kaggle.com/datasets/ttungl/adience-benchmark-gender-and-age-classification](https://www.kaggle.com/datasets/ttungl/adience-benchmark-gender-and-age-classification)

### 🎥 Recommendation Dataset
- **Name:** MovieLens 32M
- **Link:** [https://files.grouplens.org/datasets/movielens/ml-32m.zip](https://files.grouplens.org/datasets/movielens/ml-32m.zip)

---

## 🧰 Tech Stack

| Layer        | Technologies |
|--------------|--------------|
| 🧠 ML         | TensorFlow, Keras, PyTorch, Scikit-learn |
| 🎯 Backend    | Python 3.10+, FastAPI, Pydantic, MongoDB, Motor |
| ⚛️ Frontend   | React.js, TypeScript, TailwindCSS, Axios |
| 🎥 Webcam     | Web API `getUserMedia()` for face capture |
| 🧪 Testing     | Postman, Jupyter Notebooks, Model Evaluation Metrics |
| ☁️ Deployment | Docker, Kubernetes, Uvicorn, Vercel |

---

## 📁 Project Structure

```bash
clean-feed/
├── frontend/               # React UI with age gate and content pages
├── backend/                # FastAPI API for ML inference and database
├── results/               
└── README.md
```
---

## 🚀 Implementation Highlights

- 📷 **Facial Age Verification**: Real-time camera capture using `getUserMedia()` and local processing for secure, non-persistent image handling.
- 🧠 **Age Estimation Model**: A custom CNN built with TensorFlow/Keras to predict age from facial images with high accuracy and low latency.
- 🔄 **Hybrid Recommendation Engine**:
  - Content-Based Filtering using TF-IDF on tags/genres.
  - Collaborative Filtering with user-item interaction matrices.
  - Age-filtered, ranked outputs merged from both sources.
- 🧼 **Automated Content Moderation**: Multimodal analysis (image, text) with transformers to detect inappropriate content and context (e.g., sarcasm, cultural cues).
- 🔒 **Privacy-By-Design**: All facial data is processed ephemerally and never stored. GDPR and COPPA compliant handling of user data.
- 💻 **Modern Frontend Architecture**: Built with React, TailwindCSS, and TypeScript for responsiveness, accessibility, and great UX.

---

## 📈 Performance Benchmarks

| Feature                   | Metric                         |
|---------------------------|--------------------------------|
| 🧠 Age Estimation Accuracy | 65% (MAE-based)              |
| 🎯 Gender Accuracy | 92% gender-appropriateness         |
| 🌐 Frontend Load Time      | Under 1.5s (FCP on Vercel)      |

---

## 🤝 Collaboration & Contribution

We welcome developers, researchers, and designers interested in AI, privacy, or youth safety on the internet.  

Want to contribute?

- Fork the repository
- Create a feature branch
- Submit a pull request with clear documentation
- Report bugs or suggest features via GitHub Issues

Let's build safer, smarter digital platforms together! 🌐

---

## 🔮 Future Scope

- 🗣️ **Multi-modal verification**: Combine facial, voice, and typing biometrics.
- 🤖 **Reinforcement learning**: Optimize recommendations over time using user feedback.
- 📱 **Mobile & PWA support**: Deliver content across devices.
- 🧩 **Third-party SDK/API**: Allow external platforms to adopt the system.
- 🧑‍🏫 **EdTech integration**: Age-based lesson delivery and gamified learning.

---

## 👨‍💻 Authors

Developed by:

- N. Veera Manikanta (N200731)  
- N. Sai Satish (N200392)  
- M. Nayeem Basha (N200712)  
- P. Karthik (N200054)  
- K. Vijaya Kumar (N201116)  

Guided by:  
**Mr. Challapalli Srinivasu**  
Assistant Professor, Department of CSE, RGUKT Nuzvid

---

## 📜 License

This project is intended for educational and research purposes under the academic regulations of RGUKT.

---

⭐ If you find this project useful, don't forget to give it a star!
