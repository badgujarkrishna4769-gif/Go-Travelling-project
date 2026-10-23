import React, { useState, useContext, useRef, useEffect } from "react";
import ReactDOM from "react-dom";

import Button from "../../shared/components/FormElements/Button";
import Modal from "../../shared/components/UIElements/Modal";
import Map from "../../shared/components/UIElements/Map";
import "./PlaceItem.css";
import { AuthContext } from "../../shared/context/auth-context";
import { useHttpClient } from "../../shared/hooks/http-hook";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const PlaceItem = (props) => {
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const auth = useContext(AuthContext);

  const [showMap, setShowMap]                   = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [activeImg, setActiveImg]               = useState(0);

  // Build images array
  const images =
    props.images?.length > 0
      ? props.images
      : props.image
      ? [props.image]
      : [];

  // Likes / Dislikes
  const [likes, setLikes]               = useState(props.likes?.length || 0);
  const [dislikes, setDislikes]         = useState(props.dislikes?.length || 0);
  const [userLiked, setUserLiked]       = useState(
    props.likes?.map((id) => id.toString()).includes(auth.userId) || false
  );
  const [userDisliked, setUserDisliked] = useState(
    props.dislikes?.map((id) => id.toString()).includes(auth.userId) || false
  );

  // Comments
  const [comments, setComments]         = useState(
    (props.comments || []).filter((c) => c && c.name && c.text)
  );
  const [commentText, setCommentText]   = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentInputRef                 = useRef(null);

  // Focus input when panel opens
  useEffect(() => {
    if (showCommentPanel && commentInputRef.current) {
      setTimeout(() => commentInputRef.current?.focus(), 150);
    }
  }, [showCommentPanel]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (showCommentPanel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showCommentPanel]);

  const confirmDeleteHandler = async () => {
    setShowConfirmModal(false);
    try {
      await sendRequest(
        `${BACKEND_URL}/api/places/${props.id}`, // ← updated
        "DELETE",
        null,
        { Authorization: "Bearer " + auth.token }
      );
      props.onDelete(props.id);
    } catch (err) {}
  };

  const handleLike = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/places/${props.id}/like`, // ← updated
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: auth.userId }),
        }
      );
      const data = await res.json();
      setLikes(data.likes);
      setDislikes(data.dislikes);
      setUserLiked((prev) => !prev);
      setUserDisliked(false);
    } catch (err) { console.error(err); }
  };

  const handleDislike = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/places/${props.id}/dislike`, // ← updated
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: auth.userId }),
        }
      );
      const data = await res.json();
      setLikes(data.likes);
      setDislikes(data.dislikes);
      setUserDisliked((prev) => !prev);
      setUserLiked(false);
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/places/${props.id}/comment`, // ← updated
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: commentText, userId: auth.userId }),
        }
      );
      const data = await res.json();
      if (data.comment) setComments((prev) => [...prev, data.comment]);
      setCommentText("");
    } catch (err) { console.error(err); }
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (cid) => {
    try {
      await fetch(
        `${BACKEND_URL}/api/places/${props.id}/comment/${cid}`, // ← updated
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: auth.userId }),
        }
      );
      setComments((prev) => prev.filter((c) => c._id !== cid));
    } catch (err) { console.error(err); }
  };

  // ── Comment panel via Portal ──
  const commentPanel = showCommentPanel
    ? ReactDOM.createPortal(
        <div
          className="pi-card__comment-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCommentPanel(false);
          }}
        >
          <div
            className="pi-card__comment-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pi-panel__header">
              <h3>
                Comments{" "}
                <span className="pi-panel__count">({comments.length})</span>
              </h3>
              <button
                className="pi-panel__close"
                onClick={() => setShowCommentPanel(false)}
              >
                ✕
              </button>
            </div>

            <div className="pi-panel__list">
              {comments.length === 0 && (
                <div className="pi-panel__empty">
                  <span>💬</span>
                  <p>No comments yet. Be the first!</p>
                </div>
              )}
              {comments.map((c) => (
                <div key={c._id} className="pi-panel__comment">
                  <div className="pi-panel__comment-avatar">
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="pi-panel__comment-body">
                    <div className="pi-panel__comment-meta">
                      <span className="pi-panel__comment-author">{c.name}</span>
                      <span className="pi-panel__comment-date">
                        {new Date(c.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="pi-panel__comment-text">{c.text}</p>
                    {auth.userId === (c.user?.toString?.() || c.user) && (
                      <button
                        className="pi-panel__comment-delete"
                        onClick={() => handleDeleteComment(c._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {auth.isLoggedIn ? (
              <div className="pi-panel__input-row">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  className="pi-panel__input"
                />
                <button
                  className="pi-panel__submit"
                  onClick={handleAddComment}
                  disabled={isSubmitting || !commentText.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            ) : (
              <p className="pi-panel__login-hint">Login to comment.</p>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <ErrorModal error={error} onClear={clearError} />
      {commentPanel}

      <Modal
        show={showMap}
        onCancel={() => setShowMap(false)}
        header={props.address}
        contentClass="place-item__modal-content"
        footerClass="place-item__modal-actions"
        footer={<Button onClick={() => setShowMap(false)}>CLOSE</Button>}
      >
        <div className="map-container">
          <Map center={props.coordinates} zoom={16} />
        </div>
      </Modal>

      <Modal
        show={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        header="Are you sure?"
        footerClass="place-item__modal-actions"
        footer={
          <>
            <Button inverse onClick={() => setShowConfirmModal(false)}>CANCEL</Button>
            <Button danger onClick={confirmDeleteHandler}>DELETE</Button>
          </>
        }
      >
        <p>Do you want to proceed and delete this place? This can't be undone.</p>
      </Modal>

      <li className="pi-card" id={`place-${props.id}`}>
        {isLoading && <LoadingSpinner asOverlay />}

        <div className="pi-card__img-wrap">
          <img
            src={images[activeImg] || images[0]}
            alt={props.title}
            className="pi-card__img"
          />

          {images.length > 1 && (
            <button
              className="pi-card__img-arrow pi-card__img-arrow--left"
              onClick={() =>
                setActiveImg((prev) => (prev - 1 + images.length) % images.length)
              }
            >‹</button>
          )}

          {images.length > 1 && (
            <button
              className="pi-card__img-arrow pi-card__img-arrow--right"
              onClick={() =>
                setActiveImg((prev) => (prev + 1) % images.length)
              }
            >›</button>
          )}

          {images.length > 1 && (
            <div className="pi-card__img-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`pi-card__img-dot ${i === activeImg ? "pi-card__img-dot--active" : ""}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          )}

          {props.category && (
            <div className="pi-card__badges">
              <span className="pi-card__badge pi-card__badge--cat">{props.category}</span>
              {props.subcategory && (
                <span className="pi-card__badge pi-card__badge--sub">
                  {props.subcategory.replace(/_/g, " ")}
                </span>
              )}
            </div>
          )}

          {auth.userId === props.creatorId && (
            <div className="pi-card__owner-actions">
              <Button to={`/places/${props.id}`} className="pi-card__edit-btn">
                ✏️ Edit
              </Button>
              <button
                className="pi-card__delete-btn"
                onClick={() => setShowConfirmModal(true)}
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>

        <div className="pi-card__body">
          <div className="pi-card__info">
            <h2 className="pi-card__title">{props.title}</h2>
            <p className="pi-card__address">
              <span className="pi-card__address-icon">📍</span>
              {props.address}
            </p>
            <p className="pi-card__desc">{props.description}</p>
            <button className="pi-card__map-btn" onClick={() => setShowMap(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
              </svg>
              View on Map
            </button>
          </div>

          <div className="pi-card__sidebar">
            <button
              className={`pi-card__react-btn ${userLiked ? "pi-card__react-btn--liked" : ""}`}
              onClick={handleLike}
              disabled={!auth.isLoggedIn}
              title={!auth.isLoggedIn ? "Login to react" : "Like"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                viewBox="0 0 24 24"
                fill={userLiked ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              <span className="pi-card__react-count">{likes}</span>
            </button>

            <button
              className={`pi-card__react-btn ${userDisliked ? "pi-card__react-btn--disliked" : ""}`}
              onClick={handleDislike}
              disabled={!auth.isLoggedIn}
              title={!auth.isLoggedIn ? "Login to react" : "Dislike"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                viewBox="0 0 24 24"
                fill={userDisliked ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
              </svg>
              <span className="pi-card__react-count">{dislikes}</span>
            </button>

            <button
              className={`pi-card__react-btn ${showCommentPanel ? "pi-card__react-btn--active-comment" : ""}`}
              onClick={() => setShowCommentPanel((prev) => !prev)}
              title="Comments"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="pi-card__react-count">{comments.length}</span>
            </button>
          </div>
        </div>
      </li>
    </>
  );
};

export default PlaceItem;