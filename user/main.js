let pokeDiv = document.getElementById("pokePlay");
let max = 10;
let pedidos = 0;

let connection;

// Conectar al WebSocket
function connectWebSocket() {
	connection = new WebSocket("ws://localhost:8080/", "echo-protocol");

	connection.onopen = () => {
		console.log("WebSocket Client Connected");
	};

	connection.onerror = (error) => {
		console.log("Connection Error: " + error);
	};

	connection.onclose = () => {
		console.log("Connection Closed");
	};

	connection.onmessage = (message) => {
		if (message.data) {
			const user = JSON.parse(message.data);
			if (user.user == 1) {
				create_enemys(user);
				console.log(user);
			}
		}
	};
}

connectWebSocket();

let enemy_team = [];
const enemy_space = document.getElementById("enemyPlay");

function create_enemys(user) {
	enemy_team = user.team;
	enemy_space.innerHTML = "";
	for (let i = 0; i < enemy_team.length; i++) {
		paint_pokemon(enemy_team[i], "enemy");
	}
}

// Función para obtener un número aleatorio para los pokemons
function random() {
	return Math.floor(Math.random() * 100);
}

// Función para pedir la cantidad de pokemons
document.getElementById("getPokemon").addEventListener("click", () => {
	pokeDiv.innerHTML = "";
	let quantity = document.getElementById("poke_num").value;
	if (quantity == "") {
		quantity = 10;
	}
	if (quantity - pedidos > 5) {
		quantity = quantity - pedidos;
	} else {
		quantity = 5;
	}
	for (let i = 0; i < quantity; i++) {
		get_pokemons();
	}
	pedidos++;
	document.getElementById("info_continue").innerHTML =
		"<p>Seleccione 5 pokemons para iniciar partida</p>";
});

// Función para obtener los datos del pokemon
async function get_pokemons() {
	fetch("https://pokeapi.co/api/v2/pokemon/" + random())
		.then((x) => x.json())
		.then((y) => create_pokemon(y));
}

// Lista de pokemons del jugador
let pokemons_player = [];

// Crear un pokemon
function create_pokemon(pokemon) {
	let poke = new Pokemon(
		pokemon["name"],
		pokemon["stats"]["0"]["base_stat"],
		pokemon["stats"]["1"]["base_stat"],
		pokemon["stats"]["2"]["base_stat"],
		pokemon["sprites"]["front_default"],
	);
	pokemons_player.push(poke);
	paint_pokemon(poke);
}

// Pintar un pokemon en el DOM
function paint_pokemon(pokemon, user) {
	const temp = document.getElementById("template");
	const clonedTemplate = temp.content.cloneNode(true);
	let pokeSection = clonedTemplate.getElementById("pokemon");
	let nombre = clonedTemplate.getElementById("name");
	let link = clonedTemplate.getElementById("info");
	let atributes = clonedTemplate.getElementById("atributes");
	atributes.innerText =
		pokemon.hp + " / " + pokemon.atack + " / " + pokemon.defensa;
	nombre.innerText = pokemon.name;
	link.src = pokemon.img;
	pokeSection.id = pokemon.name;
	pokeSection.onclick = () => {
		make_deck(pokemon.name);
	};

	(!user ? pokeDiv : enemy_space).appendChild(clonedTemplate);
}

// Constructor para el Pokemon
function Pokemon(name, hp, atack, defensa, img) {
	this.name = name;
	this.atack = atack;
	this.defensa = defensa;
	this.img = img;
	this.hp = hp;
}

let pokemons_deck = [];

// Selector de pokemons para crear el equipo
function make_deck(id) {
	document.getElementById(id).classList.toggle("selected");
	const selected = document.getElementsByClassName("selected").length;
	if (selected == 5) {
		const boton = document.createElement("button");
		boton.innerText = "Seleccionar equipo";
		boton.id = "sendSelected";
		boton.onclick = function () {
			save_team();
		};
		document.getElementById("info_continue").appendChild(boton);
		console.log("completo");
	} else {
		if (document.getElementById("sendSelected")) {
			document.getElementById("sendSelected").remove();
		}
	}
}

// Guardar el equipo seleccionado
function save_team() {
	let temp_list = [];
	const selected = document.getElementsByClassName("selected");
	for (let i = 0; i < selected.length; i++) {
		for (let x = 0; x < pokemons_player.length; x++) {
			if (pokemons_player[x].name == selected[i].id) {
				temp_list.push(pokemons_player[x]);
			}
		}
	}
	pokemons_player = temp_list;
	console.log(pokemons_player);
	document.getElementById("pokePlay").innerHTML = "";
	document.getElementById("info_continue").innerHTML = "";
	document.getElementsByClassName("selector")[0].style.display = "none";
	for (let i = 0; i < pokemons_player.length; i++) {
		paint_pokemon(pokemons_player[i]);
	}

	// mandamos el equipo al servidor
	if (connection && connection.readyState === WebSocket.OPEN) {
		connection.send(
			JSON.stringify({ type: "selected_team", team: pokemons_player, user: 2 }),
		);
		console.log("Pokemon send");
	}
}

// nos connectamos cuando la pag se cargue
window.onload = () => {
	connectWebSocket();
};
