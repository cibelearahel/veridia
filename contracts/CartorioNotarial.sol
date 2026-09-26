// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CartorioNotarial
 * @author Cartório Distribuído
 * @notice Contrato inteligente para registro de autenticidade, timestamping
 * e verificação pública de integridade de documentos digitais em Blockchain.
 */
contract CartorioNotarial {
    
    struct DocumentRecord {
        bytes32 documentHash;       // Hash SHA-256 do arquivo original
        string title;               // Título ou identificador do documento
        string documentType;        // Tipo (ex: Certidão, Procuração, Contrato, Diploma)
        string description;         // Observações ou dados adicionais do registro
        address owner;              // Endereço da carteira que originou o registro
        uint256 registeredAt;       // Timestamp do bloco de inclusão
        bool isValid;               // Status de vigência (true = ativo, false = revogado)
        string revocationReason;    // Motivo da revogação (se aplicável)
        uint256 revokedAt;          // Timestamp do bloco de revogação
    }

    // Mapeamento: documentHash => Registro do Documento
    mapping(bytes32 => DocumentRecord) private documents;

    // Lista de todos os hashes registrados (para auditoria e listagem no explorador)
    bytes32[] private allDocumentHashes;

    // Eventos emitidos para rastreabilidade em tempo real
    event DocumentRegistered(
        bytes32 indexed documentHash,
        string title,
        string documentType,
        address indexed owner,
        uint256 registeredAt
    );

    event DocumentRevoked(
        bytes32 indexed documentHash,
        address indexed revoker,
        string reason,
        uint256 revokedAt
    );

    /**
     * @notice Registra um novo documento na Blockchain.
     * @dev Rejeita hashes vazios, títulos em branco e registros duplicados.
     * @param _documentHash Hash criptográfico (SHA-256) do arquivo original.
     * @param _title Título do documento.
     * @param _documentType Categoria ou tipo do documento.
     * @param _description Descrição ou resumo off-chain.
     */
    function registerDocument(
        bytes32 _documentHash,
        string calldata _title,
        string calldata _documentType,
        string calldata _description
    ) external {
        require(_documentHash != bytes32(0), "Hash do documento nao pode ser vazio");
        require(bytes(_title).length > 0, "Titulo do documento e obrigatorio");
        require(documents[_documentHash].registeredAt == 0, "Documento ja registrado anteriormente");

        documents[_documentHash] = DocumentRecord({
            documentHash: _documentHash,
            title: _title,
            documentType: _documentType,
            description: _description,
            owner: msg.sender,
            registeredAt: block.timestamp,
            isValid: true,
            revocationReason: "",
            revokedAt: 0
        });

        allDocumentHashes.push(_documentHash);

        emit DocumentRegistered(
            _documentHash,
            _title,
            _documentType,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Consulta e verifica a autenticidade de um documento pelo seu hash.
     * @dev Operação gratuita (view) acessível por qualquer cidadão ou entidade.
     * @param _documentHash Hash do documento a ser consultado.
     */
    function verifyDocument(bytes32 _documentHash)
        external
        view
        returns (
            bool exists,
            bool isValid,
            string memory title,
            string memory documentType,
            string memory description,
            address owner,
            uint256 registeredAt,
            string memory revocationReason,
            uint256 revokedAt
        )
    {
        DocumentRecord memory doc = documents[_documentHash];
        if (doc.registeredAt == 0) {
            return (false, false, "", "", "", address(0), 0, "", 0);
        }

        return (
            true,
            doc.isValid,
            doc.title,
            doc.documentType,
            doc.description,
            doc.owner,
            doc.registeredAt,
            doc.revocationReason,
            doc.revokedAt
        );
    }

    /**
     * @notice Revoga a validade de um documento previamente registrado.
     * @dev Apenas o proprietário original que registrou o documento pode revogá-lo.
     * @param _documentHash Hash do documento a ser revogado.
     * @param _reason Motivo justificado para a revogação.
     */
    function revokeDocument(bytes32 _documentHash, string calldata _reason) external {
        DocumentRecord storage doc = documents[_documentHash];

        require(doc.registeredAt != 0, "Documento inexistente na base de dados");
        require(doc.owner == msg.sender, "Nao autorizado: apenas o titular pode revogar");
        require(doc.isValid, "Documento ja se encontra revogado");
        require(bytes(_reason).length > 0, "Justificativa da revogacao e obrigatoria");

        doc.isValid = false;
        doc.revocationReason = _reason;
        doc.revokedAt = block.timestamp;

        emit DocumentRevoked(_documentHash, msg.sender, _reason, block.timestamp);
    }

    /**
     * @notice Verifica rapidamente se um hash já foi registrado.
     */
    function isRegistered(bytes32 _documentHash) external view returns (bool) {
        return documents[_documentHash].registeredAt != 0;
    }

    /**
     * @notice Retorna o número total de documentos registrados.
     */
    function getDocumentCount() external view returns (uint256) {
        return allDocumentHashes.length;
    }

    /**
     * @notice Retorna a lista completa de todos os hashes de documentos registrados.
     */
    function getAllDocumentHashes() external view returns (bytes32[] memory) {
        return allDocumentHashes;
    }
}
