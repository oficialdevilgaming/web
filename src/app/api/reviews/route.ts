import { NextResponse } from 'next/server';

const FALLBACK_REVIEWS = {
  rating: 5.0,
  reviews: [
    {
      user: { name: "Waldemar Perez" },
      rating: 5,
      snippet: "Excelente atención. No tienen por qué desconfiar, compren con seguridad que por algo tiene muchísimas reseñas positivas. Le compré una rx6800xt full box, con los sellos de seguridad que nunca fue abierta. Le..."
    },
    {
      user: { name: "Leito \"Black\" Maldonado" },
      rating: 5,
      snippet: "No serán las mejores fotos y hay mucho que acomodar pero lo prometido es deuda. La verdad la atención 10 puntos, maxi un genio gracias por el aguante y la paciencia, gente super confiable no duden. Suerte co..."
    },
    {
      user: { name: "Agus Reds" },
      rating: 5,
      snippet: "La placa en 2 dias ya la tenia en el correo bien embalada e impecable. Me mando mil videos de test y la estoy usando para jugar todo en ultra anda perfecto!"
    }
  ]
};

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_SERPAPI_KEY;
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_SERPAPI_KEY is not defined in environment variables. Returning fallback reviews.");
      return NextResponse.json(FALLBACK_REVIEWS);
    }

    const dataId = "0x95bcb94c39e7b181:0x56eb15460566652c";
    const url = `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=${dataId}&api_key=${apiKey}&hl=es&sort_by=newestFirst`;

    const res = await fetch(url, {
      next: { revalidate: 86400 } // Cache results for 24 hours (1 search per day)
    });

    if (!res.ok) {
      throw new Error(`SerpApi request failed with status: ${res.status}`);
    }

    const data = await res.json();

    if (data.error) {
      throw new Error(`SerpApi error: ${data.error}`);
    }

    const rating = data.place_info?.rating || 5.0;
    const rawReviews = data.reviews || [];

    const formattedReviews = rawReviews.slice(0, 3).map((r: any) => ({
      user: {
        name: r.user?.name || "Usuario de Google"
      },
      rating: r.rating || 5,
      snippet: r.snippet || "",
      date: r.date || "",
      time: r.date || "Hace poco",
    }));

    if (formattedReviews.length === 0) {
      return NextResponse.json(FALLBACK_REVIEWS);
    }

    return NextResponse.json({
      rating,
      reviews: formattedReviews,
      reviewsCount: data.place_info.reviews || 0,
    });
  } catch (error) {
    console.error("Error fetching reviews from SerpApi, returning fallback reviews:", error);
    return NextResponse.json(FALLBACK_REVIEWS);
  }
}
