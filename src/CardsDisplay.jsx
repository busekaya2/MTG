import React, { useState } from "react";
import axios from "axios";

function CardsDisplay() {
  const [query, 					setQuery] 					= useState("");
	const [errorMessageC, 	setErrorMessageC]		= useState('');
	const [errorMessageP,		setErrorMessageP]		= useState('');
  const [cards, 					setCards] 					= useState([]);
	const [totalCards, 			setTotalCards] 			= useState(0);
	const [selectedSort, 		setSelectedSort] 		= useState("");
	const [hoveredCard, 		setHoveredCard] 		= useState("");
	const [activeCards, 		setActiveCards] 		= useState([]);
	const [clickedCardName, setClickedCardName] = useState('');
	const [isModalOpen, 		setModalOpen] 			= useState(false);
	const [prints, 					setPrints] 					= useState([]);
	const [totalPrints, 		setTotalPrints] 		= useState(0);
	const [currentPage, 		setCurrentPage] 		= useState(1);
	const [nextPageUrl, 		setNextPageUrl] 		= useState("");
	const [isLoading, 			setIsLoading] 			= useState(false);

	const searchCards = async () => {
		console.log('Communicating with the API.');
	
		setCards([]);
		setNextPageUrl(null);
		setSelectedSort("");
		setTotalCards("0");
		setErrorMessageC("");
	
		setIsLoading(true);
	
		try {
			let apiUrl = nextPageUrl ? nextPageUrl : `https://api.scryfall.com/cards/search?q=${query}`;
			const response = await axios.get(apiUrl);

			setCards(response.data.data);
			setTotalCards(response.data.total_cards);

			if (response.data.has_more) {
				setNextPageUrl(response.data.next_page);
			}
		} catch (error) {
			const errorMessageC = error.response && error.response.status === 404
				? "No cards found. Your search didn’t match any cards, please try again."
				: "An error occurred";
			
			setErrorMessageC(errorMessageC);
		} finally {
			setIsLoading(false);
			setQuery("");
		}
	};

	const searchPrints = async (nameToSearch = clickedCardName) => {		
		setIsLoading(true);
		console.log('Communicating with the API.');
	
		try {
			let apiUrl = `https://api.scryfall.com/cards/search?order=released&q=!"${nameToSearch}"+include:extras&unique=prints`;
			const response = await axios.get(apiUrl);
			setPrints(response.data.data);
			setTotalPrints(response.data.total_cards);
			setIsLoading(false);
		} catch (error) {
			const errorMessageP = error.response && error.response.status === 404 ? "An error occurred" : error.message;
			setErrorMessageP(errorMessageP);
			setIsLoading(false);
		}
	};

	const cardsPerPage = 175;
	const totalPages = Math.ceil(totalCards / cardsPerPage);
	const pageButtons = Array.from({ length: totalPages }, (_, i) => i + 1);

	const goToPage = async (page) => {
		setIsLoading(true);
		setCurrentPage(page);
		await searchCards();
		setIsLoading(false);
	};	

	const nextPage = async () => {
		setIsLoading(true);
		setCurrentPage(prev => prev + 1);
		await searchCards();
		setIsLoading(false);
	};
	
	const prevPage = async () => {
		setIsLoading(true);
		setCurrentPage(prev => prev - 1);
		await searchCards();
		setIsLoading(false);
	};

	const compareByLocale = (val1, val2) => {
		if (val1 === undefined || val2 === undefined) return 0;
		return val1.localeCompare(val2);
	};
	
	const getComparator = (criteria) => {
		if (criteria === 'color_identity') {
			return ({ color_identity: aColors = [] }, { color_identity: bColors = [] }) => {
				return compareByLocale(aColors.join(''), bColors.join(''));
			};
		}
		return (a, b) => compareByLocale(a[criteria], b[criteria]);
	};
	
	const sortCards = (criteria) => {
		const comparator = getComparator(criteria);
		const sortedCards = [...cards].sort(comparator);
		setCards(sortedCards);
	};	

const handleCardEvent = (event, cardId) => {
	if (isModalOpen) return;

  const eventType = event.type;

  if (eventType === "click") {
    setActiveCards((prevActiveCards) => {
      if (prevActiveCards.includes(cardId)) {
        return prevActiveCards.filter((id) => id !== cardId);
      } else {
        return [...prevActiveCards, cardId];
      }
    });
  } else if (eventType === "mouseover" || eventType === "mouseout") {
    setHoveredCard(eventType === "mouseover" ? cardId : "");
  }
};

const handleRightClick = (name) => {
  setClickedCardName(name);
  setErrorMessageP("");
  setModalOpen(true);
  searchPrints(name);
	document.body.classList.add('no-scroll');
};

const handleClose = () => {
  setPrints([]);
	setTotalPrints("");
	setModalOpen(false);
	document.body.classList.remove('no-scroll');
};

	const getCardClass = (card, index) => {
		const classNames = ["displayCard"];
		if (card.id === hoveredCard) {classNames.push("hovered");}
		const pushIfCondition = (condition, className) => condition && classNames.push(className);
		const layouts = ["transform", "reversible_card", "modal_dfc", "art_series"];
					pushIfCondition	(layouts.some((layout) => card.layout.includes(layout)), index === 1 ? "flip-card-back" : "flip-card-front");		
					pushIfCondition	(card.layout === "transform" && card.type_line.includes("Siege"), index === 0 ? "siege" : "");
					if (card.layout === "split") {
						if (card.keywords.includes("Aftermath")) {
							pushIfCondition(true, "aftermath");
						} else {
							pushIfCondition(true, "split");
						}
					}				
		return classNames.join(" ");
	};

	const componentLabels = {
		token: '(Token)',
		meld_part: '(Part)',
		meld_result: '(Result)'
	};

	const order = ['meld_part', 'token', 'meld_result'];

	const renderImage = (card) => {
		if (card.image_uris && card.layout !== "meld" && card.layout !== "flip") {
			return (
				<div className={getCardClass(card)}>
					<img src={card.image_uris.normal} alt={card.name} />
				</div>
			);
		}
		if (card.layout === "flip") {
			return (
				<div className="upsidedown-container">
					<div className={`${activeCards.includes(card.id) ? 'upsidedown' : ''}`} onClick={() => handleCardEvent(card.id)}>
						<div className={getCardClass(card)}>
							<img src={card.image_uris.normal} alt={card.name} />
						</div>
					</div>
				</div>
			);
		}
		if (card.card_faces) {
			return (
				<div className="flip-card-container">
					<div className={`flip-card ${activeCards.includes(card.id) ? 'flipped' : 'flipped-back'}`} onClick={() => handleCardEvent(card.id)}>
						{card.card_faces.map((card_face, index) => (
							<div key={index} className={`${getCardClass(card, index)}`}>
								<img src={card_face.image_uris.normal} alt={card_face.name} />
							</div>
						))}
					</div>
				</div>
			);
		}
		if (card.all_parts && card.layout === "meld") {
			const sortedParts = [...card.all_parts].sort((a, b) => {
				return order.indexOf(a.component) - order.indexOf(b.component);
			});
			return (
				<div className={getCardClass(card)}>
					<img src={card.image_uris.normal} alt={card.name} />
					{sortedParts.map((part, index) => (
						<div key={index} className="meldCardTitle">
							<span>{part.name}</span>
							{componentLabels[part.component] || ''}
						</div>
					))}
				</div>
			);
		}
		return null;
	};

  return (
    <div>
			<div className="searchfield">
				<form onSubmit={(e) => {
					e.preventDefault();
						searchCards();}}>
					<input
						type="text"
						value={query}
						placeholder="Search by name.."
						onChange={e => setQuery(e.target.value)}
					/>
					<button onClick={searchCards}>Search</button>
				</form>
				<div className="total-cards">
					Total Cards found: {totalCards}
				</div>
			</div>
			<div className="sorting">
				<select onChange={(e) => { sortCards(e.target.value); setSelectedSort(e.target.value); }} value={selectedSort}>
					<option value="" disabled>Sort by..</option>
					<option value="rarity">Sort by Rarity</option>
					<option value="layout">Sort by Layout</option>
					<option value="name">Sort by Name</option>
					<option value="color_identity">Sort by Color</option>
				</select>
			</div>
			{errorMessageC && <div>{errorMessageC}</div>}
			{isLoading && <div className="cards-loading">Loading...</div>}
			<div className="cardContainer">
				{isModalOpen && (
					<div className="modal">
						<button onClick={handleClose}>Close</button>
						{clickedCardName} - Total Prints found: {totalPrints}
						{isLoading && <span>Loading...</span>}
						{errorMessageP && <div>{errorMessageP}</div>}
						<div className="printsContainer">
							{prints.map(print => (
								<div key={print.id}>
									<img
										className="unique-print"
										src={print.card_faces ? print.card_faces[0].image_uris.normal : print.image_uris.normal}
										alt={print.name}
									/>
								</div>
							))}
						</div>
					</div>
				)}
				{cards.map(card => (
					<div key={card.id} className="card">
						<div className="imgContainer"
							onMouseOver={(e) => handleCardEvent(e, card.id)}
							onMouseOut={(e) => handleCardEvent(e, card.id)}
							onClick={(e) => handleCardEvent(e, card.id)}
							onContextMenu={(e) => {
								e.preventDefault();
								handleRightClick(card.name);
							}}
						>
							{renderImage(card)}
						</div>
					</div>
				))}
			</div>
			<div className="pagination">
				<button onClick={prevPage} disabled={currentPage === 1 || isLoading}>Previous</button>
				{pageButtons.map((page) => (
					<button key={page} onClick={() => goToPage(page)} disabled={currentPage === page}>{page}</button>
				))}
				<button onClick={nextPage} disabled={currentPage === totalPages || isLoading || !nextPageUrl}>Next</button>
			</div>
    </div>
  );
}

export default CardsDisplay;