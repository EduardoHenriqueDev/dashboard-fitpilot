// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCbWio8rerVcId4k3WGDhrKuahOj2t2v9I",
    authDomain: "app-fitfusion.firebaseapp.com",
    projectId: "app-fitfusion",
    storageBucket: "app-fitfusion.appspot.com",
    messagingSenderId: "61815565821",
    appId: "1:61815565821:web:52334725ccd5c6896bbd94",
};

// Inicializar o Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Função para exibir os usuários e seus presets atribuídos
async function displayAssignedUsers() {
    const currentUser = auth.currentUser;
    const tableBody = document.querySelector("#assignedUsersTable tbody");
    const loadingElement = document.getElementById("loading");

    tableBody.innerHTML = "";
    loadingElement.style.display = "block"; // Exibir o carregando enquanto busca os dados

    try {
        const presetsSnapshot = await db.collection("presets").get();
        const presetsMap = new Map();

        presetsSnapshot.forEach((doc) => {
            presetsMap.set(doc.id, doc.data().name);
        });

        const usersSnapshot = await db
            .collection("users")
            .where("registeredAcademy", "==", currentUser.email)
            .get();

        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.presetAssigned && presetsMap.has(userData.presetAssigned)) {
                const row = tableBody.insertRow();
                row.classList.add("user-row");

                row.insertCell(0).textContent = userData.email;
                row.insertCell(1).textContent = presetsMap.get(userData.presetAssigned);
            }
        });
    } catch (error) {
        console.error("Erro ao exibir usuários:", error);
    } finally {
        loadingElement.style.display = "none"; // Ocultar o carregando após os dados serem carregados
    }
}

// Carregar os presets no seletor
async function loadPresets() {
    const currentUser = auth.currentUser;
    const presetSelect = document.getElementById("presetSelect");
    const loadingElement = document.getElementById("loading");

    presetSelect.innerHTML = "";
    loadingElement.style.display = "block"; // Exibir o carregando enquanto busca os dados

    try {
        const presetsSnapshot = await db
            .collection("presets")
            .where("registeredAcademy", "==", currentUser.email)
            .get();

        presetsSnapshot.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = doc.data().name;
            presetSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar presets:", error);
    } finally {
        loadingElement.style.display = "none"; // Ocultar o carregando após os dados serem carregados
    }
}

// Filtro de busca
document.getElementById("searchAssignedUsers").addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#assignedUsersTable .user-row");

    rows.forEach((row) => {
        const userCell = row.cells[0].textContent.toLowerCase();
        const presetCell = row.cells[1].textContent.toLowerCase();
        row.style.display = userCell.includes(filter) || presetCell.includes(filter) ? "" : "none";
    });
});

// Carregar os presets no seletor
async function loadPresets() {
    const currentUser = auth.currentUser;
    const presetSelect = document.getElementById("presetSelect");
    presetSelect.innerHTML = "";

    try {
        const presetsSnapshot = await db
            .collection("presets")
            .where("registeredAcademy", "==", currentUser.email)
            .get();

        presetsSnapshot.forEach((doc) => {
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = doc.data().name;
            presetSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar presets:", error);
    }
}

// Atribuir preset a um usuário
document.getElementById("assignPreset").addEventListener("click", async () => {
    const userEmail = document.getElementById("userEmail").value.trim();
    const presetId = document.getElementById("presetSelect").value.trim();

    if (!presetId) {
        alert("Por favor, selecione um preset para atribuir.");
        return;
    }

    try {
        const userSnapshot = await db.collection("users").where("email", "==", userEmail).get();
        if (userSnapshot.empty) {
            alert("Usuário não encontrado!");
            return;
        }

        const userDoc = userSnapshot.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        if (userData.presetAssigned) {
            await db.collection("presets").doc(userData.presetAssigned).update({
                assignedUser: firebase.firestore.FieldValue.arrayRemove(userEmail),
            });
        }

        await db.collection("presets").doc(presetId).update({
            assignedUser: firebase.firestore.FieldValue.arrayUnion(userEmail),
        });

        await db.collection("users").doc(userId).update({ presetAssigned: presetId });

        alert("Preset atribuído com sucesso!");
        displayAssignedUsers();
    } catch (error) {
        console.error("Erro ao atribuir preset:", error);
        alert("Erro ao atribuir preset. Verifique o console para mais detalhes.");
    }
});

// Inicialização ao carregar a página
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        displayAssignedUsers();
        loadPresets();
    } else {
        alert("Você precisa estar logado para acessar essa funcionalidade.");
    }
});

// Função para carregar os usuários no seletor
async function loadUsers() {
    const currentUser = auth.currentUser;
    const userSelect = document.getElementById("userEmail");
    userSelect.innerHTML = '<option value="" disabled selected>Selecione um usuário</option>'; // Limpar e adicionar a opção de seleção

    try {
        const usersSnapshot = await db
            .collection("users")
            .where("registeredAcademy", "==", currentUser.email)
            .get();

        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            const option = document.createElement("option");
            option.value = userData.email;
            option.textContent = userData.email; // Exibe o email do usuário
            userSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
    }
}

// Carregar a sidebar no container
fetch("../components/sidebar.html")
    .then((response) => response.text())
    .then((data) => {
        document.getElementById("sidebar-container").innerHTML = data;

        // Após carregar o HTML, inicializar a lógica do Firebase
        initializeSidebar();
    })
    .catch((error) => {
        console.error("Erro ao carregar a sidebar:", error);
    });

function initializeSidebar() {
    auth.onAuthStateChanged(function (user) {
        if (user) {
            try {
                const userId = user.uid;
                const docRef = db.collection("academias").doc(userId);  // Acessando o documento diretamente pela coleção "academias"
                docRef.get().then((docSnap) => {
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        const ownerInfoElement = document.getElementById("owner-info");
                        if (ownerInfoElement) {
                            ownerInfoElement.innerHTML = `
                            <p id="owner-name">${data.name}</p>
                            <p id="owner-email">${data.ownerEmail}</p>
                        `;
                        } else {
                            console.error("Elemento 'owner-info' não encontrado.");
                        }
                    } else {
                        console.log("Documento não encontrado no Firestore.");
                    }
                }).catch((error) => {
                    console.error("Erro ao buscar informações no Firestore:", error);
                });
            } catch (error) {
                console.error("Erro ao buscar informações no Firestore:", error);
            }
        } else {
            console.log("Nenhum usuário está logado no momento.");
        }
    });
}

window.logout = function () {
    auth.signOut()
        .then(() => {
            window.location.href = "../pages/login.html";
        })
        .catch((error) => {
            console.error("Erro ao deslogar: ", error);
        });
};

// Inicialização ao carregar a página
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadUsers(); // Carregar usuários após o login
    } else {
        alert("Você precisa estar logado para acessar essa funcionalidade.");
    }
});