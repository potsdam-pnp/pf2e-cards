# Use xelatex
$invoked_name = "xelatexmk";

# Other options we want to forward to xelatex
push @extra_xelatex_options, "-synctex=1", "-interaction=nonstopmode", "-halt-on-error", "-file-line-error";

# Files to build
@default_files = ("cards.tex", "a4print.tex");
