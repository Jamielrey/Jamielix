const { addonBuilder } = require('stremio-addon-sdk');
const manifest = require('./manifest');
const https = require('https');
const TMDB_API_KEY = 'a7f18c3c6572771ba607c42f0a613835';

// Mappa dei generi TMDB
const genreMap = {
   'azione': 28,
   'avventura': 12,
   'animazione': 16,
   'commedia': 35,
   'crime': 80,
   'documentario': 99,
   'dramma': 18,
   'famiglia': 10751,
   'fantasy': 14,
   'storia': 36,
   'horror': 27,
   'musica': 10402,
   'mistero': 9648,
   'romance': 10749,
   'fantascienza': 878,
   'televisione film': 10770,
   'thriller': 53,
   'guerra': 10752,
   'western': 37
};

// Mappa dei paesi di produzione
const productionMap = {
   'Italiana': 'it',
   'Americana': 'en'
};

// Funzione per effettuare la richiesta HTTPS
function fetch(url) {
   return new Promise((resolve, reject) => {
       https.get(url, res => {
           let data = '';
           res.on('data', chunk => { data += chunk; });
           res.on('end', () => {
               try {
                   const json = JSON.parse(data);
                   resolve(json);
               } catch (err) {
                   console.error('Error parsing JSON:', err);
                   reject(err);
               }
           });
       }).on('error', err => {
           console.error('Network error:', err);
           reject(err);
       });
   });
}

// Funzione per determinare il numero di pagina in base allo skip (per la paginazione)
// TMDB restituisce 20 risultati per pagina per default
function getPage(extra) {
   const itemsPerPage = 20;
   const skip = (extra && extra.skip) ? extra.skip : 0;
   const page = Math.floor(skip / itemsPerPage) + 1;
   return page;
}

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra, attore }) => {
   try {
       if (type === "Jamielix") {  
            let url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=it`;
            
			if (attore != "")
				{}
			
            // Filtri opzionali
            const today = new Date().toISOString().split('T')[0];
            if (extra?.Anno) {
                url += `&primary_release_year=${extra.Anno}`;
            } else {
                url += `&release_date.lte=${today}`;
            }
            if (extra?.Genere) {
                const genreId = genreMap[extra.Genere.toLowerCase()];
                if (genreId) url += `&with_genres=${genreId}`;
            }
			
			// Filtro per la Produzione (Italia o USA) utilizzando la mappa productionMap
			if (extra?.Produzione) {
				const productionCode = productionMap[extra.Produzione];
				if (productionCode) {
					url += `&with_original_language=${productionCode}`;
				}
			}

            const page = extra?.skip ? Math.floor(extra.skip / 20) + 1 : 1;
            url += `&page=${page}`;

            const response = await fetch(url);
            const results = response.results || [];

            let metas = await Promise.all(results.map(async (movie) => {
                // Chiamata API per dettagli extra
				const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=it`;
				const data = await fetch(detailsUrl);
				
				// Chiamata API per recuperare gli external IDs (in particolare l'IMDb ID)
				const externalIdsUrl = `https://api.themoviedb.org/3/movie/${movie.id}/external_ids?api_key=${TMDB_API_KEY}`;
				const externalData = await fetch(externalIdsUrl);
				const imdbId = externalData.imdb_id;  // Questo è l'IMDb ID

				// Recupera durata in minuti
				const runtime = data.runtime ? `${data.runtime} min` : null;

				// Estrai l'anno dalla data di uscita
				const releaseYear = data.release_date ? data.release_date.split('-')[0] : "N/A";

				// Recupera il rating IMDb
				const rating = data.vote_average ? data.vote_average.toFixed(1) : null;

				// Generi
				const genres = data.genres ? data.genres.map(genre => genre.name) : [];

				// Crea i link per i generi
				const genreLinks = genres.map(genre => ({
					name: genre,
					category: 'genres',
					url: `stremio:///discover/http%3A%2F%2Fjamielix.onrender.com%3A3000%2Fmanifest.json/Jamielix/movieCatalog?Genere=${genre}`
					//url: `stremio:///search?search=${genre}`
				}));

				// Recupera cast e registi
				const creditsUrl = `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}&language=it`;
				const credits = await fetch(creditsUrl);
				const castNames = credits.cast ? credits.cast.slice(0, 3).map(member => member.name) : [];
				const directors = credits.crew ? credits.crew.filter(member => member.job === "Director").map(member => member.name) : [];

				// Crea i link per il cast
				const castLinks = castNames.map(actor => ({
					name: actor,
					category: 'cast',
					url: `stremio:///search?search=${actor}`
				}));

				// Crea i link per i directors
				const directorLinks = directors.map(director => ({
					name: director,
					category: 'directors',
					url: `stremio:///search?search=${director}`
				}));

				// Costruzione oggetto meta preview, utilizzando l'IMDb ID come identificativo
				return {
					id: imdbId+"/"+imdbId,  // Usa l'IMDb ID recuperato dall'endpoint external_ids
					type: "movie",
					name: movie.title,
					poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
					posterShape: "poster",  
					background: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
					description: movie.overview,
					releaseInfo: data.release_date+" • Imdb: "+rating,
					imdbRating: rating,
					runtime: runtime,
					links: [...genreLinks, ...castLinks, ...directorLinks]
				};

            }));

            return Promise.resolve({ metas });
       }
       
       return Promise.resolve({ metas: [] });
   } catch (err) {
       console.error("Errore completo in catalogHandler:", err);
       return Promise.resolve({ metas: [] });
   }
});


builder.defineMetaHandler(async ({ type, id }) => {
    try {        
        const [prefix, tmdbId] = id.split(':');
        if (prefix !== "Jamielix") {
            return Promise.resolve({ meta: {} });
        }
        
        // Chiamata API per i dettagli del film
        const detailsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=it`;
        const data = await fetch(detailsUrl);
        
        // Recupera la durata
        const runtime = data.runtime ? `${data.runtime} min` : "N/A";
        
        // Estrai solo l'anno dalla data di uscita
        const releaseYear = data.release_date ? data.release_date.split('-')[0] : "N/A";
        
        // Recupera la valutazione IMDb
        const rating = data.vote_average ? data.vote_average.toFixed(1) : "N/A";
        
        // Recupera i generi
        const genres = data.genres ? data.genres.map(genre => genre.name) : [];

        // Recupera il cast (primi 5 attori)
        const creditsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=it`;
        const credits = await fetch(creditsUrl);
        const cast = credits.cast ? credits.cast.slice(0, 5).map(member => member.name) : [];
        
        // Recupera i registi
        const directors = credits.crew ? credits.crew.filter(member => member.job === "Director").map(member => member.name) : [];

        // Recupera la data completa di rilascio
        const releasedDate = data.release_date ? `${data.release_date}T00:00:00.000Z` : null;

        // Recupera l'IMDB ID per il pulsante "Mostra"
        const imdbId = data.imdb_id;
        const detailLink = imdbId ? `#/detail/movie/${imdbId}/${imdbId}` : id;

        // Costruzione dell'oggetto meta
        const meta = {
            id: detailLink,  
            type: "movie",
            name: data.title,
            poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
            background: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
            description: data.overview,
            releaseInfo: releaseYear,  
            imdbRating: rating,  
            runtime: runtime,  
            genres: genres,  
            director: directors,  
            cast: cast,  
            released: releasedDate  
        };
        
        return Promise.resolve({ meta });
    } catch (err) {
        console.error("Errore completo in metaHandler:", err);
        return Promise.resolve({ meta: {} });
    }
});


builder.defineStreamHandler(() => {
   return Promise.resolve({ streams: [] });
});

module.exports = builder;
