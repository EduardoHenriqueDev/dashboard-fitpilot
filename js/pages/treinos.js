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
const auth = firebase.auth(); // Obter o auth do Firebase
const db = firebase.firestore(); // Obter o Firestore
const presetsCollection = db.collection("presets");

document.getElementById("addWorkout").addEventListener("click", () => {
  const newWorkoutField = document.createElement("div");
  newWorkoutField.classList.add("workoutField", "mb-3");

  const workoutLabel = document.createElement("label");
  workoutLabel.textContent = "Dia da Semana:";
  workoutLabel.style.fontWeight = "bold";

  const workoutNameInput = document.createElement("input");
  workoutNameInput.type = "text";
  workoutNameInput.classList.add("workoutName", "form-control");
  workoutNameInput.placeholder = "Exemplo: Segunda-Feira";

  const exerciseFields = document.createElement("div");
  exerciseFields.classList.add("exerciseFields", "mt-3");

  newWorkoutField.appendChild(workoutLabel);
  newWorkoutField.appendChild(workoutNameInput);
  newWorkoutField.appendChild(exerciseFields);

  document.getElementById("workoutFields").appendChild(newWorkoutField);
});

document.getElementById("addExerciseGlobal").addEventListener("click", () => {
  const lastWorkoutField = document.querySelector("#workoutFields .workoutField:last-child");

  if (lastWorkoutField) {
    const exerciseFields = lastWorkoutField.querySelector(".exerciseFields");

    const newExerciseField = document.createElement("div");
    newExerciseField.classList.add("exerciseField", "mb-2");

    const exerciseLabel = document.createElement("label");
    exerciseLabel.textContent = "Nome do Exercício:";
    exerciseLabel.style.fontWeight = "bold";

    const newExerciseInput = document.createElement("input");
    newExerciseInput.type = "text";
    newExerciseInput.classList.add("exerciseName", "form-control");
    newExerciseInput.placeholder = "Exemplo: Supino Reto";

    newExerciseField.appendChild(exerciseLabel);
    newExerciseField.appendChild(newExerciseInput);
    exerciseFields.appendChild(newExerciseField);
  } else {
    alert("Adicione um Dia da Semana antes de inserir exercícios.");
  }
});

document.getElementById("savePreset").addEventListener("click", async () => {
  const presetName = document.getElementById("presetName").value.trim();

  const workouts = Array.from(document.querySelectorAll(".workoutField"))
    .map((field) => {
      const name = field.querySelector(".workoutName").value.trim();
      const exercises = Array.from(field.querySelectorAll(".exerciseField .exerciseName"))
        .map((input) => input.value.trim())
        .filter(Boolean);

      return { name, exercises };
    })
    .filter(({ name, exercises }) => name && exercises.length > 0);

  if (presetName && workouts.length > 0) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        alert("Você precisa estar logado para salvar o preset.");
        return;
      }

      await presetsCollection.add({
        name: presetName,
        workouts,
        registeredAcademy: user.email,
      });

      alert("Preset salvo com sucesso!");
      document.getElementById("presetName").value = "";
      document.getElementById("workoutFields").innerHTML = "";
      displayPresets();
    } catch (error) {
      console.error("Erro ao salvar preset:", error);
    }
  } else {
    alert("Preencha o nome do preset e adicione pelo menos um treino com exercícios!");
  }
});

function enableDragAndDrop() {
  const presetListContainer = document.getElementById("presetListContainer");
  const cards = presetListContainer.querySelectorAll(".preset-card");

  cards.forEach((card) => {
    card.setAttribute("draggable", "true");

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", e.target.id);
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      saveCardOrder(); // Salvar a ordem dos cards após o rearranjo
    });
  });

  presetListContainer.addEventListener("dragover", (e) => {
    e.preventDefault();

    const afterElement = getDragAfterElement(presetListContainer, e.clientX);
    const draggingCard = document.querySelector(".dragging");

    if (afterElement == null) {
      presetListContainer.appendChild(draggingCard);
    } else {
      presetListContainer.insertBefore(draggingCard, afterElement);
    }
  });
}

function getDragAfterElement(container, x) {
  const draggableElements = [...container.querySelectorAll(".preset-card:not(.dragging)")];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// Salvar a ordem dos cards no LocalStorage
function saveCardOrder() {
  const presetListContainer = document.getElementById("presetListContainer");
  const cardOrder = [...presetListContainer.children].map((card) => card.id);
  localStorage.setItem("cardOrder", JSON.stringify(cardOrder));
}

// Recuperar a ordem dos cards do LocalStorage
function loadCardOrder() {
  const cardOrder = JSON.parse(localStorage.getItem("cardOrder"));
  const presetListContainer = document.getElementById("presetListContainer");

  if (cardOrder) {
    cardOrder.forEach((cardId) => {
      const card = document.getElementById(cardId);
      if (card) {
        presetListContainer.appendChild(card);
      }
    });
  }
}

// Chamar enableDragAndDrop após exibir os presets
async function displayPresets() {
  const presetListContainer = document.getElementById("presetListContainer");
  const loadingElement = document.getElementById("loading");

  presetListContainer.innerHTML = ""; // Limpar a lista de cards

  if (loadingElement) {
    loadingElement.style.display = "block";
  }

  try {
    const user = firebase.auth().currentUser;
    if (user) {
      const querySnapshot = await presetsCollection
        .where("registeredAcademy", "==", user.email)
        .get();

      if (loadingElement) {
        loadingElement.style.display = "none";
      }

      if (querySnapshot.empty) {
        presetListContainer.innerHTML = "<p>Nenhum preset encontrado.</p>";
      } else {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const card = document.createElement("div");
          card.className = "preset-card";
          card.id = `card-${doc.id}`; // Adicionar um ID único
          card.draggable = true; // Tornar o card arrastável

          const workoutDetails = data.workouts
            .map(
              (workout) =>
                `<li><strong>${workout.name}</strong>: 
                  <ul>${workout.exercises
                  .map((ex) => `<li>${ex}</li>`)
                  .join("")}</ul></li>`
            )
            .join(" ");

          card.innerHTML = `
            <h5 class="preset-title">
              ${data.name}
              <button onclick="deletePreset('${doc.id}')" class="delete-btn" style="color: red; background-color: none; border: none;">
                <i class="fas fa-trash-alt"></i>
              </button>
            </h5>
            <ul>${workoutDetails}</ul>
          `;

          presetListContainer.appendChild(card);
        });

        loadCardOrder(); // Carregar a ordem salva
        enableDragAndDrop(); // Habilitar o recurso de arrastar e soltar
      }
    }
  } catch (error) {
    console.error("Erro ao carregar presets:", error);
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }
}

window.deletePreset = async (id) => {
  if (confirm("Tem certeza que deseja excluir este preset?")) {
    try {
      await presetsCollection.doc(id).delete();
      alert("Preset excluído com sucesso!");
      displayPresets();
    } catch (error) {
      console.error("Erro ao excluir preset:", error);
    }
  }
};

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

// Monitorar o estado de autenticação
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    displayPresets();
  } else {
    alert("Você precisa estar logado para visualizar os presets.");
  }
});
