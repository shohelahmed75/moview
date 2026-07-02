import { useEffect, useRef, useState } from "react";
import StarRating from "./components/StarRating";
import { useKey } from "./components/useKey";
import { useMovies } from "./components/useMovies";
import Login from "./components/Login";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const OMDB_KEY = "a0e45db8";

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { movies, isLoading, error } = useMovies(query);

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [watched, setWatched] = useState([]);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      const menu = document.querySelector(".mobile-menu");
      const btnMenu = document.querySelector(".btn-menu");
      if (
        menu &&
        !menu.contains(event.target) &&
        btnMenu &&
        !btnMenu.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!token) return;

    async function fetchWatchlist() {
      try {
        setIsWatchlistLoading(true);
        const res = await fetch("/api/watchlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch watchlist");
        const data = await res.json();
        setWatched(data);
      } catch (err) {
        console.error(err.message);
      } finally {
        setIsWatchlistLoading(false);
      }
    }

    fetchWatchlist();
  }, [token]);

  function handleLogin(user, token) {
    setUser(user);
    setToken(token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
  }

  function handleLogout() {
    setUser(null);
    setToken(null);
    setWatched([]);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  function handleSelectMovie(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  async function handleAddWatched(movie) {
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(movie),
      });

      if (!res.ok) throw new Error("Failed to add movie to watchlist");
      
      const savedMovie = await res.json();
      setWatched((watched) => {
        const exists = watched.some((m) => m.imdbID === savedMovie.imdbID);
        if (exists) {
          return watched.map((m) => m.imdbID === savedMovie.imdbID ? savedMovie : m);
        }
        return [...watched, savedMovie];
      });
    } catch (err) {
      console.error(err.message);
    }
  }

  async function handleDeleteWatched(id) {
    try {
      const res = await fetch(`/api/watchlist/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete movie from watchlist");
      
      setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
    } catch (err) {
      console.error(err.message);
    }
  }

  if (!user || !token) {
    return (
      <>
        <NavBar />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <NavBar
        search={
          <Search
            query={query}
            setQuery={setQuery}
            movies={movies}
            isLoading={isLoading}
            error={error}
            onSelectMovie={handleSelectMovie}
          />
        }
        profile={
          <div className="nav-user-container">
            <div className="user-profile">
              <span className="user-welcome">{user.username}</span>
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        }
        menuButton={
          <button className="btn-menu" onClick={() => setIsMenuOpen((open) => !open)} aria-label="Toggle Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        }
        menuDrawer={
          isMenuOpen && (
            <div className="mobile-menu">
              <div className="mobile-user-profile">
                <span className="user-welcome">{user.username}</span>
                <button className="btn-logout" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                  Logout
                </button>
              </div>
              <div className="mobile-watched-summary">
                <WatchedSummary watched={watched} />
              </div>
            </div>
          )
        }
      />

      <Main>
        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              {isWatchlistLoading ? (
                <Loader />
              ) : (
                <>
                  <div className="desktop-only-summary">
                    <WatchedSummary watched={watched} />
                  </div>
                  <WatchedMoviesList
                    watched={watched}
                    onDeleteWatched={handleDeleteWatched}
                  />
                </>
              )}
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function NavBar({ search, profile, menuButton, menuDrawer }) {
  return (
    <div className="nav-container-wrapper">
      <nav className="nav-bar">
        <Logo />
        <div className="desktop-search-wrapper">
          {search}
        </div>
        {profile}
        {menuButton}
        {menuDrawer}
      </nav>
      <div className="mobile-search-wrapper">
        {search}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="logo">
      <h1>FlickerBox</h1>
    </div>
  );
}

function Search({ query, setQuery, movies, isLoading, error, onSelectMovie }) {
  const inputEl = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.focus();
    setQuery("");
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (inputEl.current && !inputEl.current.contains(event.target)) {
        const dropdown = document.querySelector(".search-dropdown");
        if (dropdown && dropdown.contains(event.target)) {
          return;
        }
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="search-container">
      <input
        className="search"
        type="text"
        placeholder="Search movies..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        ref={inputEl}
      />
      {isOpen && query.length >= 3 && (
        <div className="search-dropdown">
          {isLoading && <p className="dropdown-message">Loading suggestions...</p>}
          {error && <p className="dropdown-message">{error}</p>}
          {!isLoading && !error && movies?.length === 0 && (
            <p className="dropdown-message">No movies found</p>
          )}
          {!isLoading && !error && movies?.map((movie) => (
            <button
              key={movie.imdbID}
              className="dropdown-item"
              onClick={() => {
                onSelectMovie(movie.imdbID);
                setIsOpen(false);
                setQuery("");
              }}
            >
              <img
                src={
                  !movie.Poster || movie.Poster === "N/A"
                    ? "https://via.placeholder.com/40x56?text=No+Img"
                    : movie.Poster
                }
                alt={movie.Title}
              />
              <div className="dropdown-item-info">
                <h4>{movie.Title}</h4>
                <p>Year: {movie.Year}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  return (
    <div className="box">
      {children}
    </div>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const countRef = useRef(0);

  useEffect(
    function () {
      if (userRating) countRef.current++;
    },
    [userRating]
  );

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;

  const {
    Title: title = "Unknown",
    Year: year = "Unknown",
    Poster: posterRaw = "",
    Runtime: runtimeRaw = "",
    imdbRating = "N/A",
    Plot: plot = "No plot available.",
    Released: released = "Unknown",
    Actors: actors = "Unknown",
    Director: director = "Unknown",
    Genre: genre = "Unknown",
  } = movie;

  const poster =
    !posterRaw || posterRaw === "N/A"
      ? "https://via.placeholder.com/150x220?text=No+Image"
      : posterRaw;

  let runtime = 0;
  if (runtimeRaw && runtimeRaw !== "N/A") {
    const parsed = parseInt(runtimeRaw.split(" ")[0], 10);
    runtime = isNaN(parsed) ? 0 : parsed;
  }

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: imdbRating === "N/A" ? 0 : Number(imdbRating),
      runtime,
      userRating,
      countRatingDecisions: countRef.current,
    };

    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useKey("Escape", onCloseMovie);

  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${selectedId}`
        );
        const data = await res.json();
        setMovie(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedId]
  );

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;

      return function () {
        document.title = "FlickerBox";
      };
    },
    [title]
  );

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie} aria-label="Back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 19l-7-7 7-7" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <img src={poster} alt={`Poster of ${title} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime ? `${runtime} min` : "Unknown runtime"}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐️</span>
                {imdbRating !== "N/A" ? imdbRating : "No rating"} IMDb rating
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add to list
                    </button>
                  )}
                </>
              ) : (
                <p>
                  You rated this movie {watchedUserRating} <span>⭐️</span>
                </p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const totalRuntime = watched.reduce((acc, movie) => acc + movie.runtime, 0);

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>Count</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>IMDB</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>You</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>Time</span>
          <span>{totalRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDeleteWatched }) {
  return (
    <ul className="list-watched">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <div className="card-content">
        <h3>{movie.title}</h3>
        <div className="card-meta">
          <p>
            <span>🌟</span>
            <span>{movie.imdbRating}</span>
          </p>
          <p>
            <span>⭐️</span>
            <span>{movie.userRating}</span>
          </p>
          <p>
            <span>Time:</span>
            <span>{movie.runtime} min</span>
          </p>
        </div>
        <button
          className="btn-delete"
          onClick={() => onDeleteWatched(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}
