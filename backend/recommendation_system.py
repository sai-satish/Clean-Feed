def predict_user_genres(user_id_csv_file):
    import pandas as pd
    import ast
    import joblib

    # Load model & tools
    vectorizer = joblib.load("tfidf_vectorizer-v2.pkl")
    mlb = joblib.load("genre_binarizer-v2.pkl")
    classifier = joblib.load("genre_classifier-v2.pkl")

    # Load user file
    df = pd.read_csv(user_id_csv_file)
    df['tags'] = df['tags'].apply(ast.literal_eval)
    df['genres'] = df['genres'].apply(ast.literal_eval)

    # Optional: weigh tag importance
    def boost_tags(row):
        base_tags = row['tags']
        if not row['liked']:
            return []
        weight = int(min(row['watch_duration'] / 30, 5))  # boost by duration
        return base_tags * weight

    df['boosted_tags'] = df.apply(boost_tags, axis=1)
    all_tags = [tag for sublist in df['boosted_tags'] for tag in sublist]

    if not all_tags:
        print("⚠️ No liked/watch-worthy tags found.")
        return []

    tag_string = " ".join(all_tags)

    # Vectorize and predict
    tag_vector = vectorizer.transform([tag_string])
    prediction = classifier.predict(tag_vector)
    predicted_genres = mlb.inverse_transform(prediction)

    return predicted_genres[0] if predicted_genres else []
