.PHONY: clean
.PHONY: copy

SCRIPTS=$(shell find js -type f -name '*.js' | sort)
FILES=$(shell find js -type f -name '*.js' | sort | sed 's/^/--js /' | tr '\n' ' ')

JSC_PATH=compiler.jar

COMMON_FLAGS= --js_output_file game.js \
              --summary_detail_level 3 \
              --warning_level VERBOSE \
              --language_in ECMASCRIPT5_STRICT \
              --use_types_for_optimization

ERROR_FLAGS=  --jscomp_error accessControls \
              --jscomp_error ambiguousFunctionDecl \
              --jscomp_error checkDebuggerStatement \
              --jscomp_error checkRegExp \
              --jscomp_error checkTypes \
              --jscomp_error checkVars \
              --jscomp_error const \
              --jscomp_error constantProperty \
              --jscomp_error deprecated \
              --jscomp_error duplicate \
              --jscomp_error es5Strict \
              --jscomp_error externsValidation \
              --jscomp_error fileoverviewTags \
              --jscomp_error globalThis \
              --jscomp_error internetExplorerChecks \
              --jscomp_error invalidCasts \
              --jscomp_error missingProperties \
              --jscomp_error nonStandardJsDocs \
              --jscomp_error strictModuleDepCheck \
              --jscomp_error undefinedNames \
              --jscomp_error undefinedVars \
              --jscomp_error unknownDefines \
              --jscomp_error uselessCode \
              --jscomp_error visibility

DEBUG_FLAGS=   --compilation_level WHITESPACE_ONLY
RELEASE_FLAGS= --compilation_level ADVANCED_OPTIMIZATIONS

release: $(SCRIPTS)
	java -jar $(JSC_PATH) $(RELEASE_FLAGS) $(ERROR_FLAGS) $(COMMON_FLAGS) $(FILES)

debug: $(SCRIPTS)
	java -jar $(JSC_PATH) $(DEBUG_FLAGS) $(COMMON_FLAGS) $(FILES)

clean:
	rm -Rf game.js
