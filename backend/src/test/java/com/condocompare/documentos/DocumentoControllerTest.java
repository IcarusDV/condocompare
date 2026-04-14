package com.condocompare.documentos;

import com.condocompare.BaseIntegrationTest;
import com.condocompare.auth.dto.RegisterRequest;
import com.condocompare.condominios.dto.CreateCondominioRequest;
import com.condocompare.users.entity.Role;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class DocumentoControllerTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String authToken;
    private String condominioId;

    private static final String VALID_PASSWORD = "Test@1234";
    private static int emailCounter = 0;

    @BeforeEach
    void setUp() throws Exception {
        emailCounter++;
        String email = "doc-test-" + emailCounter + "-" + System.nanoTime() + "@example.com";

        // Register a user and get auth token
        RegisterRequest registerRequest = new RegisterRequest(
                "Doc Test User",
                email,
                VALID_PASSWORD,
                null,
                Role.CORRETORA,
                "Corretora Test"
        );

        MvcResult authResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode authJson = objectMapper.readTree(authResult.getResponse().getContentAsString());
        authToken = authJson.get("accessToken").asText();

        // Create a condominio
        CreateCondominioRequest condominioRequest = new CreateCondominioRequest(
                "Condominio Teste Docs",
                "12.345.678/0001-90",
                "Rua Teste, 123",
                "123",
                null,
                "Centro",
                "Sao Paulo",
                "SP",
                "01000-000",
                null, null,
                50,   // numeroUnidades
                2,    // numeroBlocos
                2,    // numeroElevadores
                10,   // numeroAndares
                5,    // numeroFuncionarios
                2000, // anoConstrucao
                false, false, false, false, false, false, false, true,
                null, // tipoConstrucao
                null, null, null, // sindico
                null, null, // seguro
                null, // observacoes
                // estrutura estendida
                null, null, null, null, null, null, null,
                null, null, null, null, null, null,
                // seguro estendido
                null, null,
                // campos condicionais
                null, null
        );

        MvcResult condResult = mockMvc.perform(post("/api/v1/condominios")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(condominioRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode condJson = objectMapper.readTree(condResult.getResponse().getContentAsString());
        condominioId = condJson.get("id").asText();
    }

    // === Upload Tests ===

    @Test
    void shouldUploadDocument() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-apolice.pdf",
                "application/pdf",
                "fake pdf content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documentos")
                        .file(file)
                        .part(new org.springframework.mock.web.MockPart("condominioId", condominioId.getBytes()))
                        .part(new org.springframework.mock.web.MockPart("tipo", "APOLICE".getBytes()))
                        .part(new org.springframework.mock.web.MockPart("nome", "Apolice Teste".getBytes()))
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.condominioId").value(condominioId))
                .andExpect(jsonPath("$.tipo").value("APOLICE"))
                .andExpect(jsonPath("$.nome").value("Apolice Teste"))
                .andExpect(jsonPath("$.nomeArquivo").value("test-apolice.pdf"))
                .andExpect(jsonPath("$.mimeType").value("application/pdf"))
                .andExpect(jsonPath("$.status").value("PENDENTE"));
    }

    @Test
    void shouldUploadDocumentWithOptionalFields() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "orcamento-porto.pdf",
                "application/pdf",
                "fake pdf content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documentos")
                        .file(file)
                        .part(new org.springframework.mock.web.MockPart("condominioId", condominioId.getBytes()))
                        .part(new org.springframework.mock.web.MockPart("tipo", "ORCAMENTO".getBytes()))
                        .part(new org.springframework.mock.web.MockPart("nome", "Orcamento Porto".getBytes()))
                        .part(new org.springframework.mock.web.MockPart("observacoes", "Orcamento valido".getBytes()))
                        .part(new org.springframework.mock.web.MockPart("seguradoraNome", "Porto Seguro".getBytes()))
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("ORCAMENTO"))
                .andExpect(jsonPath("$.seguradoraNome").value("Porto Seguro"))
                .andExpect(jsonPath("$.observacoes").value("Orcamento valido"));
    }

    @Test
    void shouldRejectUploadWithInvalidMimeType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/x-msdownload",
                "bad content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documentos")
                        .file(file)
                        .part(new org.springframework.mock.web.MockPart("condominioId", condominioId.getBytes()))
                        .part(new org.springframework.mock.web.MockPart("tipo", "OUTRO".getBytes()))
                        .part(new org.springframework.mock.web.MockPart("nome", "Arquivo Invalido".getBytes()))
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void shouldRejectUploadWithNonExistentCondominio() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "fake pdf content".getBytes()
        );

        String fakeCondominioId = UUID.randomUUID().toString();

        mockMvc.perform(multipart("/api/v1/documentos")
                        .file(file)
                        .part(new org.springframework.mock.web.MockPart("condominioId", fakeCondominioId.getBytes()))
                        .part(new org.springframework.mock.web.MockPart("tipo", "APOLICE".getBytes()))
                        .part(new org.springframework.mock.web.MockPart("nome", "Test Doc".getBytes()))
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().is4xxClientError());
    }

    // === Listing Tests ===

    @Test
    void shouldListDocuments() throws Exception {
        // Upload a document first
        uploadTestDocument("Lista Doc 1", "APOLICE");

        mockMvc.perform(get("/api/v1/documentos")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void shouldListDocumentsByCondominio() throws Exception {
        uploadTestDocument("Condo Doc 1", "APOLICE");

        mockMvc.perform(get("/api/v1/documentos/condominio/" + condominioId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void shouldListDocumentsByCondominioAndTipo() throws Exception {
        uploadTestDocument("Orcamento Test", "ORCAMENTO");

        mockMvc.perform(get("/api/v1/documentos/condominio/" + condominioId + "/tipo/ORCAMENTO")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    void shouldFilterDocumentsByTipo() throws Exception {
        uploadTestDocument("Filtro Doc", "SINISTRO");

        mockMvc.perform(get("/api/v1/documentos")
                        .param("tipo", "SINISTRO")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    // === Get by ID Tests ===

    @Test
    void shouldGetDocumentById() throws Exception {
        String docId = uploadTestDocument("Doc By ID", "APOLICE");

        mockMvc.perform(get("/api/v1/documentos/" + docId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(docId))
                .andExpect(jsonPath("$.nome").value("Doc By ID"))
                .andExpect(jsonPath("$.tipo").value("APOLICE"))
                .andExpect(jsonPath("$.condominioId").value(condominioId))
                .andExpect(jsonPath("$.status").value("PENDENTE"));
    }

    @Test
    void shouldReturn4xxForNonExistentDocument() throws Exception {
        String fakeId = UUID.randomUUID().toString();

        mockMvc.perform(get("/api/v1/documentos/" + fakeId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().is4xxClientError());
    }

    // === Document Types Endpoint ===

    @Test
    void shouldReturnDocumentTypes() throws Exception {
        mockMvc.perform(get("/api/v1/documentos/tipos")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(6)))
                .andExpect(jsonPath("$[0]").value("APOLICE"))
                .andExpect(jsonPath("$[1]").value("ORCAMENTO"));
    }

    // === Update Tests ===

    @Test
    void shouldUpdateDocumentMetadata() throws Exception {
        String docId = uploadTestDocument("Original Name", "APOLICE");

        String updateJson = """
                {
                    "nome": "Updated Name",
                    "observacoes": "Updated observations"
                }
                """;

        mockMvc.perform(put("/api/v1/documentos/" + docId)
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Updated Name"))
                .andExpect(jsonPath("$.observacoes").value("Updated observations"));
    }

    // === Delete Tests ===

    @Test
    void shouldSoftDeleteDocument() throws Exception {
        String docId = uploadTestDocument("To Delete", "OUTRO");

        mockMvc.perform(delete("/api/v1/documentos/" + docId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isNoContent());

        // After soft delete, getting by ID should return 4xx (filtered by active=true)
        mockMvc.perform(get("/api/v1/documentos/" + docId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().is4xxClientError());
    }

    // === Authentication Tests ===

    @Test
    void shouldRejectUnauthenticatedUpload() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "fake content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/documentos")
                        .file(file)
                        .part(new org.springframework.mock.web.MockPart("condominioId", condominioId.getBytes()))
                        .part(new org.springframework.mock.web.MockPart("tipo", "APOLICE".getBytes()))
                        .part(new org.springframework.mock.web.MockPart("nome", "Test".getBytes())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectUnauthenticatedListing() throws Exception {
        mockMvc.perform(get("/api/v1/documentos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectUnauthenticatedGetById() throws Exception {
        mockMvc.perform(get("/api/v1/documentos/" + UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectUnauthenticatedTipos() throws Exception {
        mockMvc.perform(get("/api/v1/documentos/tipos"))
                .andExpect(status().isUnauthorized());
    }

    // === Helper Methods ===

    /**
     * Uploads a test PDF document and returns its ID.
     */
    private String uploadTestDocument(String nome, String tipo) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                nome.toLowerCase().replace(" ", "-") + ".pdf",
                "application/pdf",
                ("fake pdf content for " + nome).getBytes()
        );

        MvcResult result = mockMvc.perform(multipart("/api/v1/documentos")
                        .file(file)
                        .part(new org.springframework.mock.web.MockPart("condominioId", condominioId.getBytes()))
                        .part(new org.springframework.mock.web.MockPart("tipo", tipo.getBytes()))
                        .part(new org.springframework.mock.web.MockPart("nome", nome.getBytes()))
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asText();
    }
}
