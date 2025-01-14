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
const usersCollection = db.collection("users");

document
    .getElementById("registerStudent")
    .addEventListener("click", async () => {
        const studentName = document.getElementById("studentName").value.trim();
        const studentEmail = document.getElementById("studentEmail").value.trim();
        const studentPassword = document
            .getElementById("studentPassword")
            .value.trim();

        // Validar os campos
        if (!studentName || !studentEmail || !studentPassword) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        if (!studentEmail.includes("@")) {
            alert("Por favor, insira um e-mail válido.");
            return;
        }

        if (studentPassword.length < 6) {
            alert("A senha deve ter no mínimo 6 caracteres.");
            return;
        }

        const currentUser = firebase.auth().currentUser;

        if (!currentUser) {
            alert("Você precisa estar logado para cadastrar um aluno.");
            return;
        }

        try {
            // Obter o token de autenticação do administrador
            const adminToken = await currentUser.getIdToken();

            // Criar o usuário usando a API REST do Firebase Authentication
            const createUserResponse = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCbWio8rerVcId4k3WGDhrKuahOj2t2v9I`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: studentEmail,
                        password: studentPassword,
                        returnSecureToken: false,
                    }),
                }
            );

            if (!createUserResponse.ok) {
                const errorData = await createUserResponse.json();
                throw new Error(errorData.error.message || "Erro ao criar o usuário.");
            }

            // Obter o UID do usuário criado
            const createUserResult = await createUserResponse.json();
            const newUserUID = createUserResult.localId;

            // Criar um documento na coleção 'users' com o UID do Auth
            const newUserRef = db.collection("users").doc(newUserUID);
            await newUserRef.set({
                name: studentName,
                email: studentEmail,
                registeredAcademy: currentUser.email, // O e-mail do administrador logado
            });

            alert("Aluno cadastrado com sucesso!");

            // Limpar os campos do formulário
            document.getElementById("studentName").value = "";
            document.getElementById("studentEmail").value = "";
            document.getElementById("studentPassword").value = "";

            // Chamar a função loadStudents para atualizar a tabela imediatamente
            loadStudents();
        } catch (error) {
            console.error("Erro ao cadastrar o aluno:", error);
            alert("Erro ao cadastrar o aluno. Tente novamente.");
        }
    });

async function loadStudents() {
    const currentUser = firebase.auth().currentUser;

    try {
        // Exibir o indicador de carregamento
        document.getElementById("loading").style.display = "block";

        // Buscar os alunos que possuem o campo registeredAcademy igual ao e-mail do usuário logado
        const snapshot = await db
            .collection("users")
            .where("registeredAcademy", "==", currentUser.email)
            .get();

        // Limpar a tabela antes de inserir os novos alunos
        const studentsList = document.getElementById("studentsList");
        studentsList.innerHTML = "";

        snapshot.forEach((doc) => {
            const studentData = doc.data();
            const studentId = doc.id;

            // Criar uma nova linha para cada aluno
            const row = document.createElement("tr");

            // Inserir os dados do aluno nas células
            row.innerHTML = `
                      <td>${studentData.name}</td>
                      <td>${studentData.email}</td>
                      <td>
                          <button class="btn btn-sm" style="color: black; background-color: none; border: none;" 
                                  value="${studentId}" 
                                  onclick="editStudent(this.value)">
                              <i class="fas fa-pencil-alt"></i> <!-- Ícone de lápis -->
                          </button>
                          <button class="btn btn-sm" style="color: red; background-color: none; border: none;" 
                                  onclick="deleteStudent('${studentId}')">
                              <i class="fas fa-trash-alt"></i> <!-- Ícone de lixeira -->
                          </button>
                      </td>
                  `;

            // Adicionar a linha à tabela
            studentsList.appendChild(row);
        });

        // Esconder o indicador de carregamento
        document.getElementById("loading").style.display = "none";

    } catch (error) {
        console.error("Erro ao carregar os alunos:", error);
        alert("Erro ao carregar os alunos.");
    }
}

function createEditStudentModal(studentData) {
    console.log("ID do aluno ao criar modal:", studentData.id);

    return `
          <div class="modal" id="editStudentModal" tabindex="-1" role="dialog" aria-labelledby="editStudentModalLabel" aria-hidden="true">
              <div class="modal-dialog" role="document">
                  <div class="modal-content">
                      <!-- Cabeçalho com a faixa verde -->
                      <div class="modal-header custom-header">
                          <h5 class="modal-title" id="editStudentModalLabel">Editar Aluno</h5>
                          <button type="button" class="close custom-close" data-dismiss="modal" aria-label="Close" onclick="closeModal()">
                              <span aria-hidden="true">&times;</span>
                          </button>
                      </div>
                      <div class="modal-body d-flex flex-column">
                          <form id="editStudentForm" class="flex-grow-1">
                              <!-- Campo invisível para armazenar o ID do aluno -->
                              <input type="hidden" id="studentId" value="${studentData.id || ""
        }">
                              
                              <div class="form-group">
                                  <label for="studentName">Nome</label>
                                  <input type="text" class="form-control" id="studentName" value="${studentData.name || ""
        }" required>
                              </div>
                              <div class="form-group">
                                  <label for="studentEmail">Email</label>
                                  <input type="email" class="form-control" id="studentEmail" value="${studentData.email || ""
        }" required>
                              </div>
                              <div class="form-group">
                                  <label for="studentPassword">Senha</label>
                                  <input type="password" class="form-control" id="studentPassword" value="" placeholder="Deixe em branco para não alterar">
                              </div>
                          </form>
                          <!-- O botão será posicionado no final da div modal-body -->
                          <button type="button" class="btn btn-primary btn-save mt-3 ml-auto d-block" onclick="saveStudentChanges()">Salvar alterações</button>
                      </div>
                  </div>
              </div>
          </div>
        `;
}

function editStudent(studentId) {
    console.log("ID do aluno recebido pelo botão:", studentId);

    const studentRef = db.collection("users").doc(studentId);

    studentRef
        .get()
        .then((doc) => {
            if (doc.exists) {
                const studentData = doc.data();
                studentData.id = studentId; // Adiciona o ID ao objeto de dados do aluno
                console.log("Aluno encontrado:", studentData);

                // Remover o modal existente (se houver) antes de criar um novo
                const existingModal = document.getElementById("editStudentModal");
                if (existingModal) {
                    existingModal.remove();
                }

                // Gerar o HTML do modal e inseri-lo no DOM
                const modalHTML = createEditStudentModal(studentData);
                document.body.insertAdjacentHTML("beforeend", modalHTML);

                // Exibir o modal com os dados preenchidos
                openModalWithData();
            } else {
                console.error("Aluno não encontrado com o ID:", studentId);
                alert("Aluno não encontrado.");
            }
        })
        .catch((error) => {
            console.error("Erro ao carregar os dados do aluno:", error);
            alert(
                "Erro ao carregar os dados do aluno. Verifique o console para mais detalhes."
            );
        });
}

// Função para abrir o modal com os dados preenchidos
function openModalWithData() {
    try {
        var myModal = new bootstrap.Modal(
            document.getElementById("editStudentModal")
        );
        myModal.show(); // Exibe o modal
    } catch (error) {
        console.error("Erro ao abrir o modal:", error);
    }
}

async function saveStudentChanges() {
    const studentId = document.getElementById("studentId").value;

    if (!studentId) {
        console.error("ID do aluno não fornecido!");
        alert("Erro: ID do aluno não encontrado.");
        return;
    }

    // Obter os valores dos campos após edição
    const studentNameInput = document.getElementById("studentName");
    const studentEmailInput = document.getElementById("studentEmail");
    const studentPasswordInput = document.getElementById("studentPassword");

    const newName = studentNameInput.value.trim();
    const newEmail = studentEmailInput.value.trim();
    const newPassword = studentPasswordInput.value.trim();

    console.log("Valores enviados para salvar:", {
        newName,
        newEmail,
        newPassword,
    });

    try {
        // Referência ao Firestore
        const studentRef = db.collection("users").doc(studentId);

        // Obter os dados atuais do Firestore
        const doc = await studentRef.get();
        if (!doc.exists) {
            console.error("Aluno não encontrado com o ID:", studentId);
            alert("Aluno não encontrado.");
            return;
        }

        const studentData = doc.data();
        const updatedData = {};

        // Verificar alterações e preparar o objeto updatedData
        if (newName && newName !== studentData.name.trim()) {
            updatedData.name = newName;
        }

        if (newEmail && newEmail !== studentData.email.trim()) {
            updatedData.email = newEmail;
        }

        if (Object.keys(updatedData).length > 0) {
            console.log("Atualizando dados no Firestore:", updatedData);
            await studentRef.update(updatedData);
            console.log("Dados atualizados no Firestore:", updatedData);
        } else {
            console.log("Nenhuma alteração detectada no Firestore.");
        }

        // Atualizar no Firebase Authentication se necessário
        const user = firebase.auth().currentUser;
        if (newEmail && newEmail !== studentData.email) {
            try {
                await user.updateEmail(newEmail);
                console.log("E-mail atualizado no Firebase Authentication.");
            } catch (error) {
                console.error(
                    "Erro ao atualizar e-mail no Firebase Authentication:",
                    error
                );
                alert("Erro ao atualizar e-mail no Firebase Authentication.");
                return;
            }
        }

        if (newPassword) {
            try {
                await user.updatePassword(newPassword);
                console.log("Senha atualizada no Firebase Authentication.");
            } catch (error) {
                console.error(
                    "Erro ao atualizar senha no Firebase Authentication:",
                    error
                );
                alert("Erro ao atualizar senha no Firebase Authentication.");
                return;
            }
        }

        // Atualizar os valores nos campos de input
        studentNameInput.value = newName || studentData.name;
        studentEmailInput.value = newEmail || studentData.email;

        // Fechar o modal
        closeModal();
        alert("Alterações salvas com sucesso!");
    } catch (error) {
        console.error("Erro ao salvar as alterações:", error);
        alert(
            "Erro ao salvar as alterações. Verifique o console para mais detalhes."
        );
    }
}

// Função para fechar o modal e limpar os campos
function closeModal() {
    try {
        // Limpar os campos do modal
        const studentName = document.getElementById("studentName");
        const studentEmail = document.getElementById("studentEmail");
        const studentPassword = document.getElementById("studentPassword");

        if (studentName && studentEmail && studentPassword) {
            studentName.value = "";
            studentEmail.value = "";
            studentPassword.value = "";
        }

        // Fechar o modal
        const modalElement = document.getElementById("editStudentModal");
        if (modalElement) {
            var myModal = bootstrap.Modal.getInstance(modalElement);
            if (myModal) {
                myModal.hide(); // Fecha o modal
            }

            // Remover o modal do DOM após fechar
            modalElement.remove(); // Remove o modal do DOM
        }

        // Remover o backdrop do DOM
        const backdropElements = document.querySelectorAll(".modal-backdrop");
        backdropElements.forEach((backdrop) => backdrop.remove()); // Remove todos os elementos backdrop
    } catch (error) {
        console.error("Erro ao fechar o modal:", error);
    }
}

// Função para excluir um aluno
function deleteStudent(studentId) {
    if (confirm("Tem certeza de que deseja excluir este aluno?")) {
        const studentRef = db.collection("users").doc(studentId);

        studentRef
            .delete()
            .then(() => {
                console.log("Aluno excluído com sucesso.");
                alert("Aluno excluído com sucesso.");
                loadStudents(); // Recarregar a lista de alunos
            })
            .catch((error) => {
                console.error("Erro ao excluir aluno:", error);
                alert("Erro ao excluir aluno.");
            });
    }
}

// Verificar o estado de autenticação quando a página carregar
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        // O usuário está autenticado
        loadStudents(); // Carregar a lista de alunos
    } else {
        // O usuário não está autenticado
        console.log("Usuário não autenticado.");
        alert("Você precisa estar logado para visualizar os alunos.");
    }
});

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

// Função para filtrar alunos pela barra de pesquisa
document
    .getElementById("searchStudents")
    .addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase(); // Pega o valor da pesquisa em minúsculas
        const rows = document.querySelectorAll("#studentsList tr"); // Seleciona todas as linhas da tabela

        rows.forEach((row) => {
            const name = row
                .querySelector("td:nth-child(1)")
                .textContent.toLowerCase(); // Nome do aluno
            const email = row
                .querySelector("td:nth-child(2)")
                .textContent.toLowerCase(); // E-mail do aluno

            // Verifica se o nome ou e-mail contém o termo de pesquisa
            if (name.includes(searchTerm) || email.includes(searchTerm)) {
                row.style.display = ""; // Exibe a linha
            } else {
                row.style.display = "none"; // Oculta a linha
            }
        });
    });