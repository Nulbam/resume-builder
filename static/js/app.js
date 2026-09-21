/**
 * AI Resume & Portfolio Builder - 프론트엔드 자바스크립트 (app.js)
 * 폼 제출, API 비동기 통신, 로딩 처리, 오류 안내, 클립보드 복사, 마크다운 파일 다운로드
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. 화면의 주요 HTML 요소들을 변수로 가져오기
    const form = document.getElementById("resume-form");
    const submitBtn = document.getElementById("submit-btn");
    const errorBox = document.getElementById("error-box");
    const loadingBox = document.getElementById("loading-box");
    const resultBox = document.getElementById("result-box");
    const resumeOutput = document.getElementById("resume-output");
    const portfolioOutput = document.getElementById("portfolio-output");
    const copyResumeBtn = document.getElementById("copy-resume-btn");
    const copyPortfolioBtn = document.getElementById("copy-portfolio-btn");
    const downloadMdBtn = document.getElementById("download-md-btn");

    // 최신 생성 결과 데이터를 보관하는 변수
    let currentResult = {
        name: "",
        jobTitle: "",
        resume: "",
        portfolio: "",
        fullMarkdown: ""
    };

    /**
     * 오류 메시지를 화면에 표시하는 도우미 함수
     */
    function showError(message) {
        errorBox.textContent = message;
        errorBox.style.display = "block";
        errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    /**
     * 오류 메시지를 숨기는 도우미 함수
     */
    function hideError() {
        errorBox.textContent = "";
        errorBox.style.display = "none";
    }

    /**
     * 로딩 상태(스피너 표시, 버튼 잠금) 전환 함수
     */
    function setLoading(isLoading) {
        if (isLoading) {
            loadingBox.style.display = "block";
            resultBox.style.display = "none";
            submitBtn.disabled = true;
            submitBtn.textContent = "AI가 작성 중입니다...";
            hideError();
            loadingBox.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            loadingBox.style.display = "none";
            submitBtn.disabled = false;
            submitBtn.textContent = "AI 이력서 & 포트폴리오 생성하기";
        }
    }

    // 템플릿 카드 선택 시 UI 활성화 처리
    const templateCards = document.querySelectorAll(".template-card");
    templateCards.forEach(card => {
        card.addEventListener("click", () => {
            templateCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            const radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    // 2. 폼 제출(Submit) 이벤트 처리
    form.addEventListener("submit", async (event) => {
        // 기본 폼 제출 동작(새로고침) 방지
        event.preventDefault();
        hideError();

        // 입력값 가져오기 및 공백 제거
        const name = document.getElementById("name").value.trim();
        const jobTitle = document.getElementById("job-title").value.trim();
        const experience = document.getElementById("experience").value.trim();
        const projects = document.getElementById("projects").value.trim();
        const tone = document.getElementById("tone").value;
        const selectedRadio = document.querySelector('input[name="prompt_type"]:checked');
        const promptType = selectedRadio ? selectedRadio.value : "A";
        const selectedTemplate = document.querySelector('input[name="template_style"]:checked');
        const templateStyle = selectedTemplate ? selectedTemplate.value : "sample1";

        // [프론트엔드 입력 검증] 필수 항목 누락 검사
        if (!name) {
            showError("이름을 입력해 주세요.");
            document.getElementById("name").focus();
            return;
        }
        if (!jobTitle) {
            showError("지원 직무를 입력해 주세요.");
            document.getElementById("job-title").focus();
            return;
        }
        if (!experience) {
            showError("주요 경력 사항을 입력해 주세요.");
            document.getElementById("experience").focus();
            return;
        }
        if (!projects) {
            showError("핵심 프로젝트 경험을 입력해 주세요.");
            document.getElementById("projects").focus();
            return;
        }

        // 로딩 시작
        setLoading(true);

        try {
            // Flask 백엔드 /generate 엔드포인트로 비동기 POST 요청 전송
            const response = await fetch("/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    job_title: jobTitle,
                    experience: experience,
                    projects: projects,
                    tone: tone,
                    prompt_type: promptType,
                    template_style: templateStyle
                })
            });

            const data = await response.json();

            // 백엔드 처리 성공 여부 확인
            if (!response.ok || !data.success) {
                const errorMessage = data.error || "이력서 생성 중 문제가 발생했습니다. 다시 시도해 주세요.";
                showError(errorMessage);
                return;
            }

            // 생성된 결과 데이터 저장
            currentResult = {
                name: name,
                jobTitle: jobTitle,
                resume: data.resume || "",
                portfolio: data.portfolio || "",
                fullMarkdown: data.full_markdown || `${data.resume}\n\n---\n\n${data.portfolio}`
            };

            // 선택한 템플릿에 따른 결과창 클래스 적용 (6가지 템플릿 전용 테마 자동 매칭)
            resumeOutput.className = "content-preview";
            const currentTpl = data.template_style || templateStyle || "blue_timeline";
            resumeOutput.classList.add(`template-${currentTpl}-view`);

            // 화면 결과창에 마크다운을 예쁜 HTML 문서로 렌더링하여 표시
            if (typeof marked !== "undefined" && marked.parse) {
                resumeOutput.innerHTML = marked.parse(currentResult.resume);
                portfolioOutput.innerHTML = marked.parse(currentResult.portfolio);
            } else {
                resumeOutput.textContent = currentResult.resume;
                portfolioOutput.textContent = currentResult.portfolio;
            }

            // 결과 영역 보이기
            resultBox.style.display = "block";
            resultBox.scrollIntoView({ behavior: "smooth", block: "start" });

        } catch (networkError) {
            console.error("통신 에러 발생:", networkError);
            showError("서버와 통신하는 중 오류가 발생했습니다. 백엔드 서버(app.py)가 실행 중인지 확인해 주세요.");
        } finally {
            // 로딩 종료
            setLoading(false);
        }
    });

    /**
     * 클립보드 복사 공통 함수
     */
    async function copyToClipboard(text, buttonElement, defaultLabel) {
        if (!text) {
            alert("복사할 내용이 없습니다.");
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            buttonElement.textContent = "복사 완료!";
            buttonElement.style.backgroundColor = "#059669";
            buttonElement.style.color = "#ffffff";

            setTimeout(() => {
                buttonElement.textContent = defaultLabel;
                buttonElement.style.backgroundColor = "";
                buttonElement.style.color = "";
            }, 2000);
        } catch (err) {
            console.error("복사 실패:", err);
            alert("클립보드 복사에 실패했습니다. 직접 텍스트를 드래그하여 복사해 주세요.");
        }
    }

    // 3. 이력서 복사 버튼 이벤트
    copyResumeBtn.addEventListener("click", () => {
        copyToClipboard(currentResult.resume, copyResumeBtn, "이력서 복사");
    });

    // 4. 포트폴리오 복사 버튼 이벤트
    copyPortfolioBtn.addEventListener("click", () => {
        copyToClipboard(currentResult.portfolio, copyPortfolioBtn, "포트폴리오 복사");
    });

    // 5. 마크다운(.md) 파일 다운로드 버튼 이벤트
    downloadMdBtn.addEventListener("click", () => {
        if (!currentResult.fullMarkdown) {
            alert("다운로드할 결과물이 없습니다.");
            return;
        }

        // 파일 내용 생성 (Blob)
        const blob = new Blob([currentResult.fullMarkdown], { type: "text/markdown;charset=utf-8;" });
        const downloadUrl = URL.createObjectURL(blob);

        // 가상의 링크 태그를 만들어 파일 다운로드 트리거
        const tempLink = document.createElement("a");
        tempLink.href = downloadUrl;
        
        // 안전한 파일명 생성 (예: 홍길동_백엔드개발자_이력서_포트폴리오.md)
        const safeName = currentResult.name.replace(/\s+/g, "_") || "지원자";
        const safeJob = currentResult.jobTitle.replace(/\s+/g, "_") || "이력서";
        tempLink.download = `${safeName}_${safeJob}_이력서_포트폴리오.md`;

        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);

        // 메모리 해제
        URL.revokeObjectURL(downloadUrl);
    });
});
