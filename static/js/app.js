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
    const downloadResumeImgBtn = document.getElementById("download-resume-img-btn");
    const cardResumeImgBtn = document.getElementById("card-resume-img-btn");

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

    /**
     * 6. 이력서를 고화질 단일 이미지(PNG)로 캡처하여 저장하는 함수 (전체 내용 누락 없이 완전 저장)
     */
    async function saveResumeAsImage(triggerBtn) {
        if (!currentResult.resume) {
            alert("저장할 이력서 결과물이 없습니다. 먼저 이력서를 생성해 주세요.");
            return;
        }

        if (typeof html2canvas === "undefined") {
            alert("이미지 변환 엔진을 준비하는 중입니다. 잠시 후 다시 눌러주세요.");
            return;
        }

        const targetElement = document.getElementById("resume-output");
        if (!targetElement) return;

        const originalText = triggerBtn ? triggerBtn.textContent : "";
        if (triggerBtn) {
            triggerBtn.disabled = true;
            triggerBtn.textContent = "⏳ 전체 이력서 이미지 생성 중...";
        }

        // 스크롤 박스(max-height: 600px)에 의해 잘리는 현상을 완벽 방지하기 위해 스타일 백업
        const originalMaxHeight = targetElement.style.maxHeight;
        const originalOverflow = targetElement.style.overflow;
        const originalOverflowY = targetElement.style.overflowY;
        const originalHeight = targetElement.style.height;

        try {
            // 1. 높이 및 스크롤 제한을 완전히 해제하여 이력서 전체 내용 펼치기
            targetElement.style.maxHeight = "none";
            targetElement.style.overflow = "visible";
            targetElement.style.overflowY = "visible";
            targetElement.style.height = "auto";

            // 브라우저 렌더 트리가 전체 높이로 계산될 수 있도록 미세 대기
            await new Promise((resolve) => setTimeout(resolve, 80));

            // 2. 펼쳐진 전체 높이 및 너비 정밀 측정
            const fullHeight = Math.max(targetElement.scrollHeight, targetElement.offsetHeight);
            const fullWidth = Math.max(targetElement.scrollWidth, targetElement.offsetWidth, 760);

            // 3. html2canvas로 전체 영역을 2배 고해상도로 캡처
            const canvas = await html2canvas(targetElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                width: fullWidth,
                height: fullHeight,
                windowWidth: fullWidth,
                windowHeight: fullHeight,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    const clonedTarget = clonedDoc.getElementById("resume-output");
                    if (clonedTarget) {
                        clonedTarget.style.maxHeight = "none";
                        clonedTarget.style.overflow = "visible";
                        clonedTarget.style.overflowY = "visible";
                        clonedTarget.style.height = "auto";
                        clonedTarget.style.padding = "36px 30px";
                        clonedTarget.style.boxShadow = "none";
                        clonedTarget.style.backgroundColor = "#ffffff";
                    }
                    // 상위 부모 요소들의 스크롤 및 높이 제한도 일괄 해제
                    let parent = clonedTarget ? clonedTarget.parentElement : null;
                    while (parent && parent !== clonedDoc.body) {
                        parent.style.overflow = "visible";
                        parent.style.maxHeight = "none";
                        parent.style.height = "auto";
                        parent = parent.parentElement;
                    }
                }
            });

            // 4. 캔버스를 고화질 PNG 데이터로 추출하여 다운로드 트리거
            const imgData = canvas.toDataURL("image/png");
            const tempLink = document.createElement("a");
            const safeName = currentResult.name.replace(/\s+/g, "_") || "지원자";
            const safeJob = currentResult.jobTitle.replace(/\s+/g, "_") || "직무";

            tempLink.href = imgData;
            tempLink.download = `${safeName}_${safeJob}_이력서.png`;
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);

            if (triggerBtn) {
                triggerBtn.textContent = "✅ 전체 이미지 저장 완료!";
                setTimeout(() => {
                    triggerBtn.textContent = originalText;
                    triggerBtn.disabled = false;
                }, 2200);
            }
        } catch (error) {
            console.error("이력서 이미지 저장 오류:", error);
            alert("이미지 저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
            if (triggerBtn) {
                triggerBtn.textContent = originalText;
                triggerBtn.disabled = false;
            }
        } finally {
            // 5. 화면 표시 스타일 복원 (화면에서는 다시 깔끔한 스크롤 뷰로 복귀)
            targetElement.style.maxHeight = originalMaxHeight;
            targetElement.style.overflow = originalOverflow;
            targetElement.style.overflowY = originalOverflowY;
            targetElement.style.height = originalHeight;
        }
    }

    if (downloadResumeImgBtn) {
        downloadResumeImgBtn.addEventListener("click", () => saveResumeAsImage(downloadResumeImgBtn));
    }
    if (cardResumeImgBtn) {
        cardResumeImgBtn.addEventListener("click", () => saveResumeAsImage(cardResumeImgBtn));
    }
});

