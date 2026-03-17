package com.condocompare.documentos.messaging;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoProcessingMessage implements Serializable {

    private UUID documentoId;
    private UUID condominioId;
    private String tipo;
    private String objectKey;
    private String bucketName;
    private String mimeType;
    private String nomeArquivo;
}
